import dns from "node:dns";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { createServerClient } from "@quranjs/api/server";
import type { ChapterId } from "@quranjs/api";
import { askGemini, isGeminiConfigured, type ChatTurn } from "./gemini";

dns.setDefaultResultOrder("ipv4first");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Generous enough for normal app usage (a screen can fire several of these on load),
// but stops one client from hammering the upstream Quran API through our credentials.
app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// A tighter, shared (not per-IP) budget for AI calls — Gemini's free tier is
// a handful of requests per minute for the whole API key, not per user, so
// this has to cap total traffic across every client rather than each one.
app.use(
  "/api/ai",
  rateLimit({
    windowMs: 60_000,
    limit: 8,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: () => "global",
    message: { error: "AI requests are limited right now — try again in a minute." },
  })
);

const quran = createServerClient({
  clientId: process.env.QF_CLIENT_ID!,
  clientSecret: process.env.QF_CLIENT_SECRET!,
  services: {
    gatewayUrl: "https://apis.quran.foundation",
    oauth2BaseUrl: "https://oauth2.quran.foundation",
  },
});

// GET ALL CHAPTERS
app.get("/api/quran/chapters", async (_req, res) => {
  try {
    const chapters = await quran.content.v4.chapters.list();

    console.log("CHAPTER COUNT:", chapters.length);

    res.json(chapters);
  } catch (error) {
    console.error("Quran API error:", error);

    res.status(500).json({
      error: "Kunne ikke hente suraher",
    });
  }
});

// GET VERSES FROM ONE SURAH
app.get("/api/quran/chapters/:id/verses", async (req, res) => {
  const idNum = Number(req.params.id);
  if (!Number.isInteger(idNum) || idNum < 1 || idNum > 114) {
    return res.status(400).json({ error: "Ugyldig surah-id" });
  }

  try {
    const chapterId = req.params.id as ChapterId;
    const verses = await quran.content.v4.verses.byChapter(chapterId, {
      words: true,
      wordFields: { textQpcHafs: true },
      translations: [131],
      perPage: 300,
    });

    res.json(verses);
  } catch (error) {
    console.error("Quran verses error:", error);

    res.status(500).json({
      error: "Kunne ikke hente versene",
    });
  }
});

// GET AUDIO FOR ONE AYAH
app.get("/api/quran/verses/:verseKey/audio", async (req, res) => {
  const verseKey = req.params.verseKey;
  if (!/^\d{1,3}:\d{1,3}$/.test(verseKey)) {
    return res.status(400).json({ error: "Ugyldig verseKey" });
  }

  const reciterId = String(req.query.reciter ?? "7");
  if (!/^\d{1,4}$/.test(reciterId)) {
    return res.status(400).json({ error: "Ugyldig reciter-id" });
  }

  try {
    const audio = await quran.content.v4.audio.verseRecitation.byKey(
      verseKey as any,
      reciterId
    );

    res.json(audio);
  } catch (error) {
    console.error("Quran audio error:", error);

    res.status(500).json({
      error: "Kunne ikke hente lyd",
    });
  }
});
app.get("/api/quran/recitations", async (_req, res) => {
  try {
    const recitations = await quran.content.v4.resources.recitations.list();
    res.json(recitations);
  } catch (error) {
    console.error("Recitations error:", error);
    res.status(500).json({ error: "Kunne ikke hente reciters" });
  }
});

// Hadith text comes from fawazahmed0/hadith-api, a free, no-auth-required CDN
// (jsDelivr) mirror of classical collections. No API key needed, unlike Quran.
type HadithEntry = {
  hadithnumber: number;
  arabicnumber?: number | string;
  text?: string;
  grades: unknown[];
  reference: { book: number; hadith: number };
};

type HadithEdition = {
  metadata: { name: string; sections: Record<string, string> };
  hadiths: HadithEntry[];
};

const HADITH_COLLECTIONS = {
  bukhari: "Sahih al-Bukhari",
  muslim: "Sahih Muslim",
  nawawi: "40 Hadith Nawawi",
} as const;

type HadithCollectionKey = keyof typeof HADITH_COLLECTIONS;

function isHadithCollection(value: string): value is HadithCollectionKey {
  return Object.prototype.hasOwnProperty.call(HADITH_COLLECTIONS, value);
}

const hadithEditionCache = new Map<HadithCollectionKey, HadithEdition>();

async function fetchHadithEdition(collection: HadithCollectionKey): Promise<HadithEdition> {
  const cached = hadithEditionCache.get(collection);
  if (cached) return cached;

  const response = await fetch(
    `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${collection}.min.json`
  );
  if (!response.ok) {
    throw new Error(`Upstream hadith fetch failed: ${response.status}`);
  }

  const data = (await response.json()) as HadithEdition;
  hadithEditionCache.set(collection, data);
  return data;
}

app.get("/api/hadith/collections", (_req, res) => {
  res.json(Object.entries(HADITH_COLLECTIONS).map(([key, name]) => ({ key, name })));
});

// GET SECTIONS (BOOKS/CHAPTERS) FOR ONE COLLECTION
app.get("/api/hadith/:collection/sections", async (req, res) => {
  const { collection } = req.params;
  if (!isHadithCollection(collection)) {
    return res.status(400).json({ error: "Ukjent hadith-samling" });
  }

  try {
    const edition = await fetchHadithEdition(collection);
    const ranges = new Map<number, { first: number; last: number; count: number }>();

    for (const hadith of edition.hadiths) {
      const book = hadith.reference.book;
      const range = ranges.get(book);
      if (!range) {
        ranges.set(book, { first: hadith.hadithnumber, last: hadith.hadithnumber, count: 1 });
      } else {
        range.last = hadith.hadithnumber;
        range.count += 1;
      }
    }

    const sections = Object.entries(edition.metadata.sections)
      .filter(([number, title]) => title && ranges.has(Number(number)))
      .map(([number, title]) => {
        const range = ranges.get(Number(number))!;
        return {
          number: Number(number),
          title,
          hadithCount: range.count,
          firstHadith: range.first,
          lastHadith: range.last,
        };
      });

    res.json(sections);
  } catch (error) {
    console.error("Hadith sections error:", error);
    res.status(500).json({ error: "Kunne ikke hente hadith-seksjoner" });
  }
});

// GET ALL HADITH WITHIN ONE SECTION
app.get("/api/hadith/:collection/sections/:sectionNumber", async (req, res) => {
  const { collection } = req.params;
  if (!isHadithCollection(collection)) {
    return res.status(400).json({ error: "Ukjent hadith-samling" });
  }

  const sectionNumber = Number(req.params.sectionNumber);
  if (!Number.isInteger(sectionNumber) || sectionNumber < 0) {
    return res.status(400).json({ error: "Ugyldig seksjonsnummer" });
  }

  try {
    const edition = await fetchHadithEdition(collection);
    const title = edition.metadata.sections[String(sectionNumber)];
    const hadiths = edition.hadiths.filter((h) => h.reference.book === sectionNumber);

    if (!title || hadiths.length === 0) {
      return res.status(404).json({ error: "Fant ikke seksjonen" });
    }

    res.json({ number: sectionNumber, title, hadiths });
  } catch (error) {
    console.error("Hadith section error:", error);
    res.status(500).json({ error: "Kunne ikke hente hadith-seksjonen" });
  }
});

app.get("/api/ai/status", (_req, res) => {
  res.json({ configured: isGeminiConfigured() });
});

app.post("/api/ai/ask", async (req, res) => {
  if (!isGeminiConfigured()) {
    return res.status(503).json({ error: "AI isn't configured on this server yet" });
  }

  const { message, history } = req.body ?? {};

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Missing message" });
  }
  if (message.length > 2000) {
    return res.status(400).json({ error: "Message is too long" });
  }

  const cleanHistory: ChatTurn[] = Array.isArray(history)
    ? history
        .filter(
          (turn): turn is ChatTurn =>
            !!turn && (turn.role === "user" || turn.role === "assistant") && typeof turn.text === "string"
        )
        .slice(-20)
    : [];

  try {
    const reply = await askGemini(message.trim(), cleanHistory);
    res.json({ reply });
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(502).json({ error: "Could not get a response from the AI right now" });
  }
});

// Catches anything that slips past the try/catches above — malformed request
// bodies, unexpected throws — so a client only ever sees a plain message,
// never a stack trace with local file paths in it. Express recognises this as
// the error handler purely by its 4-argument signature, so it must come last.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) return;
  const status = (err as { status?: number; statusCode?: number })?.status ?? (err as { statusCode?: number })?.statusCode ?? 500;
  res.status(status).json({ error: "Something went wrong" });
});

app.listen(PORT, () => {
  console.log(`Rihla API kjører på http://localhost:${PORT}`);
});