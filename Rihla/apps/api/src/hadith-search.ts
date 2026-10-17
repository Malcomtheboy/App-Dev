export type SearchableEdition = {
  collection: string;
  name: string;
  hadiths: { hadithnumber: number; text?: string; reference: { book: number } }[];
};

export type HadithHit = {
  collection: string;
  collectionName: string;
  number: number;
  section: number;
  excerpt: string;
};

const MIN_QUERY = 3;
const MAX_QUERY = 60;
const MAX_TERMS = 5;
const WINDOW = 170;

// Returns the cleaned query, or null when it isn't a usable search (not text,
// too short to be meaningful, or long enough to be abuse).
export function normalizeQuery(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const query = raw.replace(/\s+/g, " ").trim();
  return query.length >= MIN_QUERY && query.length <= MAX_QUERY ? query : null;
}

export function excerptAround(text: string, index: number, length: number): string {
  if (text.length <= WINDOW) return text;
  const start = Math.max(0, index - Math.floor((WINDOW - length) / 2));
  const end = Math.min(text.length, start + WINDOW);
  const slice = text.slice(start, end).trim();
  return `${start > 0 ? "…" : ""}${slice}${end < text.length ? "…" : ""}`;
}

function occurrences(haystack: string, needle: string): number {
  let count = 0;
  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + needle.length)) count += 1;
  return count;
}

// A hadith matches when every word of the query appears in it. Hadith that
// contain the whole phrase, and that mention the words more often, come first;
// of two equally good matches the shorter, more focused text wins.
export function searchHadiths(
  editions: SearchableEdition[],
  query: string,
  limit = 30,
): { total: number; results: HadithHit[] } {
  const phrase = query.toLowerCase();
  const terms = [...new Set(phrase.split(" ").filter(Boolean))].slice(0, MAX_TERMS);
  const scored: { hit: HadithHit; score: number; length: number }[] = [];

  for (const edition of editions) {
    for (const hadith of edition.hadiths) {
      const text = hadith.text;
      if (!text) continue;
      const lower = text.toLowerCase();
      if (!terms.every((term) => lower.includes(term))) continue;

      const phraseAt = lower.indexOf(phrase);
      const score = (phraseAt !== -1 ? 100 : 0) + terms.reduce((sum, term) => sum + occurrences(lower, term), 0);
      const anchor = phraseAt !== -1 ? phraseAt : lower.indexOf(terms[0]);
      scored.push({
        score,
        length: text.length,
        hit: {
          collection: edition.collection,
          collectionName: edition.name,
          number: hadith.hadithnumber,
          section: hadith.reference.book,
          excerpt: excerptAround(text, anchor, terms[0].length),
        },
      });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.length - b.length);
  return { total: scored.length, results: scored.slice(0, limit).map((entry) => entry.hit) };
}
