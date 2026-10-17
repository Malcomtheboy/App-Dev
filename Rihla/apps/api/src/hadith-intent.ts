import { normalizeQuery } from "./hadith-search.js";

// Spots the questions that are really "look this hadith up" requests, so they
// can be answered straight from our own hadith library instead of spending a
// Gemini request. It is deliberately strict: anything that asks for meaning,
// an explanation, a ruling or a judgement still goes to the AI.

export type HadithCollectionKey = "bukhari" | "muslim" | "nawawi";

export type HadithIntent =
  | { kind: "reference"; collection: HadithCollectionKey; number: number }
  | { kind: "topic"; query: string };

const MAX_MESSAGE = 120;

const NEEDS_THOUGHT =
  /\b(explain|explanation|meaning|means?|why|how|interpret\w*|rulings?|allowed|permissible|halal|haram|should\s+i|can\s+i|may\s+i|commentary|tafsir|sharh|compare|difference|summari[sz]e|authentic\w*|graded?|isnad|chain)\b/i;

const ALIASES: { pattern: RegExp; collection: HadithCollectionKey; unambiguous: boolean }[] = [
  { pattern: /\b(?:sahih\s+)?(?:al[-\s]?)?bukhari\b/i, collection: "bukhari", unambiguous: true },
  { pattern: /\b(?:an[-\s]?)?nawawi\b|\b(?:40|forty)\s+hadiths?\b/i, collection: "nawawi", unambiguous: true },
  // "Muslim" is also just a word, so it only counts as a collection when the
  // message says "sahih muslim" or asks for a hadith.
  { pattern: /\b(?:sahih\s+)?muslim\b/i, collection: "muslim", unambiguous: false },
];

const FILLER = new Set([
  "show", "me", "read", "give", "get", "find", "what", "whats", "what's", "is", "the", "of", "in", "from",
  "please", "tell", "can", "you", "could", "would", "hadith", "hadiths", "ahadith", "number", "no", "nr",
  "sahih", "al", "an", "a", "to", "see", "quote", "text", "for", "number", "#",
]);

const TOPIC_PATTERNS = [
  /^(?:please\s+)?(?:(?:can|could|would)\s+you\s+)?(?:please\s+)?(?:(?:show|give|find|get|list|send|read|search\s+for|look\s+up)\s+(?:me\s+)?)?(?:(?:a|an|some|the|any|few|a\s+few|all)\s+)?(?:hadiths?|ahadith)\s+(?:about|on|regarding|concerning|related\s+to|for)\s+(.+)$/i,
  /^(?:are\s+there|is\s+there|do\s+you\s+have)\s+(?:any\s+|a\s+)?(?:hadiths?|ahadith)\s+(?:about|on|regarding|concerning)\s+(.+)$/i,
  /^what\s+(?:hadiths?|ahadith)\s+(?:are\s+there\s+|do\s+you\s+have\s+)?(?:about|on|regarding)\s+(.+)$/i,
  /^(?:what(?:'s|\s+is)\s+(?:the\s+)?|tell\s+me\s+(?:the\s+)?)hadiths?\s+(?:about|on|regarding)\s+(.+)$/i,
];

function detectReference(message: string): HadithIntent | null {
  const wantsHadith = /\bhadiths?\b|\bahadith\b/i.test(message);

  for (const alias of ALIASES) {
    const match = alias.pattern.exec(message);
    if (!match) continue;
    if (!alias.unambiguous && !wantsHadith && !/\bsahih\s+muslim\b/i.test(message)) continue;

    // Remove every spelling of this collection (e.g. both "40 hadith" and "Nawawi").
    const rest = message.replace(new RegExp(alias.pattern.source, "gi"), " ");
    const numbers = rest.match(/\d{1,5}/g) ?? [];
    if (numbers.length !== 1) return null;

    // Everything else in the message has to be filler: this is a lookup, not a question.
    const leftovers = rest
      .replace(/\d{1,5}/g, " ")
      .toLowerCase()
      .split(/[^a-z'#]+/)
      .filter((word) => word && !FILLER.has(word));
    if (leftovers.length > 0) return null;

    const number = Number(numbers[0]);
    return number >= 1 ? { kind: "reference", collection: alias.collection, number } : null;
  }
  return null;
}

function detectTopic(message: string): HadithIntent | null {
  for (const pattern of TOPIC_PATTERNS) {
    const match = pattern.exec(message.trim());
    if (!match) continue;

    const topic = match[1]
      .replace(/[?.!\s]+$/, "")
      .replace(/\s+please$/i, "")
      .replace(/^(?:the|a|an)\s+/i, "")
      .trim();
    const query = normalizeQuery(topic);
    if (!query || query.split(" ").length > 6) return null;
    return { kind: "topic", query };
  }
  return null;
}

export function detectHadithIntent(message: string): HadithIntent | null {
  const text = message.replace(/\s+/g, " ").trim();
  if (!text || text.length > MAX_MESSAGE || NEEDS_THOUGHT.test(text)) return null;
  return detectReference(text) ?? detectTopic(text);
}
