import { ApiError, GoogleGenAI } from "@google/genai";
import type { Content } from "@google/genai";

// "gemini-flash-lite-latest" — the lite tier, which fits this use case (short
// chat answers) better than full flash anyway, and free-tier quota is tracked
// separately per model, so it isn't sharing a budget with anything else.
// Alias, so it doesn't need bumping by hand as new versions ship
// (docs: https://ai.google.dev/gemini-api/docs).
const MODEL = "gemini-flash-lite-latest";

const SYSTEM_INSTRUCTION = `You are the Rihla Guide, a learning assistant inside Rihla, an Islamic companion app.
Answer questions about prayer, Quran, hadith and daily practice clearly and considerately.
You are not a mufti: never issue a personal religious ruling (fatwa) on someone's specific situation. For those, tell the user to ask a qualified local scholar instead.
Keep answers concise — a few sentences, not an essay — since this is read in a mobile chat.
Write in plain text only: no markdown (no asterisks, no bold, no headings), since the app displays your reply as plain text and formatting marks would show up literally.

Sources: end every reply with exactly one final line in this format, and nothing after it:
SOURCES: quran 2:255; quran 112:1-4; nawawi 1; bukhari 52
Allowed kinds are "quran" (surah:ayah or surah:first-last), and "bukhari", "muslim" or "nawawi" followed by the hadith number in that collection. List at most 3, only references you are certain exist and that directly support your answer, and never invent one. If you are not certain of any, write: SOURCES: none
Do not mention this line or its format in the rest of your reply.`;

export type ExperienceLevel = "new" | "beginner" | "advanced";

export function isExperienceLevel(value: unknown): value is ExperienceLevel {
  return value === "new" || value === "beginner" || value === "advanced";
}

const LEVEL_NOTES: Record<ExperienceLevel, string> = {
  new: "The user is new to Islam. Use simple everyday language, explain any Arabic term the first time you use it, and be warm and encouraging.",
  beginner: "The user knows the basics and is building on them. Keep explanations clear, and briefly explain terms that are not common knowledge.",
  advanced: "The user is experienced. You may use technical terms (fiqh, usul, hadith sciences) without explaining them and go a little deeper, while staying concise.",
};

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  client = new GoogleGenAI({ apiKey });
  return client;
}

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export type ChatTurn = { role: "user" | "assistant"; text: string };

function toContent(turn: ChatTurn): Content {
  return {
    role: turn.role === "assistant" ? "model" : "user",
    parts: [{ text: turn.text }],
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The free tier returns a 503 "high demand" error fairly often even when the
// key and request are both fine — it's usually worth one immediate retry
// before giving up and surfacing an error to the user.
export async function askGemini(
  message: string,
  history: ChatTurn[] = [],
  level: ExperienceLevel = "beginner",
): Promise<string> {
  const ai = getClient();

  const chat = ai.chats.create({
    model: MODEL,
    history: history.map(toContent),
    config: {
      systemInstruction: `${SYSTEM_INSTRUCTION}\n\n${LEVEL_NOTES[level]}`,
      maxOutputTokens: 500,
    },
  });

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await chat.sendMessage({ message });
      const text = response.text;
      if (!text) {
        throw new Error("Gemini returned an empty response");
      }
      return text.trim();
    } catch (error) {
      lastError = error;
      const retryable = error instanceof ApiError && error.status === 503;
      if (!retryable || attempt === 1) break;
      await sleep(1500);
    }
  }
  throw lastError;
}
