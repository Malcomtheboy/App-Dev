import dns from "node:dns";
import express, { type RequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { createServerClient } from "@quranjs/api/server";
import type { ChapterId } from "@quranjs/api";
import { askGemini, isExperienceLevel, isGeminiConfigured, type ChatTurn } from "./gemini.js";
import { quranLabel, quranRefIsReal, splitSources, type SourceRef } from "./sources.js";
import { createAiSecurity } from "./ai-security.js";
import { createAdminUsersRouter } from "./admin-users.js";
import { detectHadithIntent, type HadithIntent } from "./hadith-intent.js";
import { normalizeQuery, searchHadiths } from "./hadith-search.js";

dns.setDefaultResultOrder("ipv4first");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// In-memory operational stats for the admin portal's Overview page. Reset on
// restart — this is a live health view, not a record, and holds no user data.
const startedAt = Date.now();
const traffic = { total: 0, clientErrors: 0, serverErrors: 0, byGroup: {} as Record<string, number> };

type UpstreamName = "quran" | "hadith" | "ai";
const upstreams: Record<UpstreamName, { ok: number; failed: number; lastOk: number | null; lastError: number | null }> = {
  quran: { ok: 0, failed: 0, lastOk: null, lastError: null },
  hadith: { ok: 0, failed: 0, lastOk: null, lastError: null },
  ai: { ok: 0, failed: 0, lastOk: null, lastError: null },
};

function markUpstream(name: UpstreamName, ok: boolean) {
  const stats = upstreams[name];
  if (ok) {
    stats.ok += 1;
    stats.lastOk = Date.now();
  } else {
    stats.failed += 1;
    stats.lastError = Date.now();
  }
}

app.use("/api", (req, res, next) => {
  if (req.path !== "/health") {
    const group = req.path.split("/")[1] || "other";
    res.on("finish", () => {
      traffic.total += 1;
      traffic.byGroup[group] = (traffic.byGroup[group] ?? 0) + 1;
      if (res.statusCode >= 500) traffic.serverErrors += 1;
      else if (res.statusCode >= 400) traffic.clientErrors += 1;
    });
  }
  next();
});

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

    markUpstream("quran", true);
    res.json(chapters);
  } catch (error) {
    markUpstream("quran", false);
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

    markUpstream("quran", true);
    res.json(verses);
  } catch (error) {
    markUpstream("quran", false);
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

    markUpstream("quran", true);
    res.json(audio);
  } catch (error) {
    markUpstream("quran", false);
    console.error("Quran audio error:", error);

    res.status(500).json({
      error: "Kunne ikke hente lyd",
    });
  }
});
app.get("/api/quran/recitations", async (_req, res) => {
  try {
    const recitations = await quran.content.v4.resources.recitations.list();
    markUpstream("quran", true);
    res.json(recitations);
  } catch (error) {
    markUpstream("quran", false);
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

  try {
    const response = await fetch(
      `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${collection}.min.json`
    );
    if (!response.ok) {
      throw new Error(`Upstream hadith fetch failed: ${response.status}`);
    }

    const data = (await response.json()) as HadithEdition;
    hadithEditionCache.set(collection, data);
    markUpstream("hadith", true);
    return data;
  } catch (error) {
    markUpstream("hadith", false);
    throw error;
  }
}

app.get("/api/hadith/collections", (_req, res) => {
  res.json(Object.entries(HADITH_COLLECTIONS).map(([key, name]) => ({ key, name })));
});

// SEARCH THE ENGLISH TEXT OF EVERY COLLECTION
app.get("/api/hadith/search", async (req, res) => {
  const query = normalizeQuery(req.query.q);
  if (!query) {
    return res.status(400).json({ error: "Search for 3 to 60 characters" });
  }

  try {
    const keys = Object.keys(HADITH_COLLECTIONS) as HadithCollectionKey[];
    const editions = await Promise.all(
      keys.map(async (collection) => ({
        collection,
        name: HADITH_COLLECTIONS[collection],
        hadiths: (await fetchHadithEdition(collection)).hadiths,
      })),
    );
    res.json({ query, ...searchHadiths(editions, query) });
  } catch (error) {
    console.error("Hadith search error:", error);
    res.status(500).json({ error: "Kunne ikke søke i hadith" });
  }
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

type VerifiedSource =
  | { kind: "quran"; label: string; surahId: number; ayah: number }
  | { kind: "hadith"; label: string; collection: string; number: number; section: number; excerpt: string };

let chapterInfo: Map<number, { name: string; versesCount: number }> | null = null;

async function getChapterInfo() {
  if (chapterInfo) return chapterInfo;
  const chapters = await quran.content.v4.chapters.list();
  chapterInfo = new Map(
    chapters.map((chapter) => [chapter.id, { name: chapter.nameSimple, versesCount: chapter.versesCount }]),
  );
  return chapterInfo;
}

function hadithSource(collection: HadithCollectionKey, hadith: HadithEntry): VerifiedSource {
  return {
    kind: "hadith",
    label: `${HADITH_COLLECTIONS[collection]} ${hadith.hadithnumber}`,
    collection,
    number: hadith.hadithnumber,
    section: hadith.reference.book,
    excerpt: (hadith.text ?? "").slice(0, 240),
  };
}

// Questions that are plain hadith lookups are answered from our own library
// (the same data as the Hadith tab), which costs no Gemini request. Returns
// null when the library has nothing, so the question still reaches the AI.
const MAX_QUOTED = 1200;

async function answerFromHadithLibrary(
  intent: HadithIntent,
): Promise<{ reply: string; sources: VerifiedSource[] } | null> {
  if (intent.kind === "reference") {
    const name = HADITH_COLLECTIONS[intent.collection];
    const edition = await fetchHadithEdition(intent.collection);
    const hadith = edition.hadiths.find((entry) => entry.hadithnumber === intent.number);
    if (!hadith?.text) {
      const last = edition.hadiths[edition.hadiths.length - 1]?.hadithnumber;
      return { reply: `I couldn't find hadith number ${intent.number} in ${name}. It goes up to ${last}.`, sources: [] };
    }
    const full = hadith.text.trim();
    const quoted =
      full.length > MAX_QUOTED ? `${full.slice(0, MAX_QUOTED).trimEnd()}…\n\nOpen the source below to read the rest.` : full;
    return { reply: `${name}, hadith ${intent.number}:\n\n${quoted}`, sources: [hadithSource(intent.collection, hadith)] };
  }

  const keys = Object.keys(HADITH_COLLECTIONS) as HadithCollectionKey[];
  const editions = await Promise.all(
    keys.map(async (collection) => ({
      collection,
      name: HADITH_COLLECTIONS[collection],
      hadiths: (await fetchHadithEdition(collection)).hadiths,
    })),
  );
  const { total, results } = searchHadiths(editions, intent.query, 3);
  if (total === 0) return null;

  const sources = results.flatMap((hit) => {
    const edition = editions.find((entry) => entry.collection === hit.collection);
    const hadith = edition?.hadiths.find((entry) => entry.hadithnumber === hit.number);
    return hadith ? [hadithSource(hit.collection as HadithCollectionKey, hadith)] : [];
  });
  const closest = sources.length === 1 ? "the closest match" : `the closest ${sources.length}`;
  return {
    reply: `I found ${total} hadith about "${intent.query}" in the collections. Here ${sources.length === 1 ? "is" : "are"} ${closest}. Open one to read it in full.`,
    sources,
  };
}

let libraryAnswers = 0;

// Runs after sign-in but BEFORE the Gemini rate limits, so these answers don't
// use up anyone's AI budget.
const answerFromLibrary: RequestHandler = async (req, res, next) => {
  const message = req.body?.message;
  if (typeof message !== "string") return next();

  const intent = detectHadithIntent(message);
  if (!intent) return next();

  try {
    const answer = await answerFromHadithLibrary(intent);
    if (!answer) return next();
    libraryAnswers += 1;
    res.json({ ...answer, via: "library" });
  } catch (error) {
    console.error("Hadith library answer failed:", error);
    next();
  }
};

// Keeps only references that really exist. Anything the model got wrong (a
// surah that isn't there, an ayah past the end, a hadith number that doesn't
// exist) is silently dropped instead of being shown as a source.
async function verifySources(refs: SourceRef[]): Promise<VerifiedSource[]> {
  const verified: VerifiedSource[] = [];
  for (const ref of refs) {
    try {
      if (ref.kind === "quran") {
        const info = (await getChapterInfo()).get(ref.surah);
        if (info && quranRefIsReal(ref, info.versesCount)) {
          verified.push({ kind: "quran", label: quranLabel(info.name, ref), surahId: ref.surah, ayah: ref.from });
        }
      } else {
        const edition = await fetchHadithEdition(ref.collection);
        const hadith = edition.hadiths.find((entry) => entry.hadithnumber === ref.number);
        if (hadith) verified.push(hadithSource(ref.collection, hadith));
      }
    } catch (error) {
      console.error("Source check failed:", error);
    }
  }
  return verified;
}

app.get("/api/ai/status", (_req, res) => {
  res.json({ configured: isGeminiConfigured() });
});

// Operational snapshot for the admin Overview page. Only counters and
// timestamps — no request contents, no user identifiers.
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    startedAt,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    traffic,
    services: {
      quran: { configured: !!process.env.QF_CLIENT_ID && !!process.env.QF_CLIENT_SECRET, ...upstreams.quran },
      hadith: { configured: true, cachedCollections: [...hadithEditionCache.keys()], ...upstreams.hadith },
      ai: { configured: isGeminiConfigured(), ...upstreams.ai, libraryAnswers },
    },
  });
});

// Privileged account operations. The router independently verifies a current
// Firebase ID token and the caller's admins/{uid} role before every request.
app.use("/api/admin/users", createAdminUsersRouter());

// Sign-in, then plain hadith lookups from our own library, then the per-user
// and shared Gemini limits, then Gemini itself.
const [requireUser, ...aiBudgets] = createAiSecurity();

app.post("/api/ai/ask", requireUser, answerFromLibrary, ...aiBudgets, async (req, res) => {
  if (!isGeminiConfigured()) {
    return res.status(503).json({ error: "AI isn't configured on this server yet" });
  }

  const { message, history, level } = req.body ?? {};

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
    const raw = await askGemini(message.trim(), cleanHistory, isExperienceLevel(level) ? level : "beginner");
    markUpstream("ai", true);
    const { text, refs } = splitSources(raw);
    res.json({ reply: text || raw.trim(), sources: await verifySources(refs) });
  } catch (error) {
    markUpstream("ai", false);
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
