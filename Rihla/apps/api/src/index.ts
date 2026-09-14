import dns from "node:dns";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServerClient } from "@quranjs/api/server";
import type { ChapterId } from "@quranjs/api";

dns.setDefaultResultOrder("ipv4first");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
  try {
    const verseKey = req.params.verseKey;

    const reciterId = String(req.query.reciter ?? "7");

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
app.listen(PORT, () => {
  console.log(`Rihla API kjører på http://localhost:${PORT}`);
});