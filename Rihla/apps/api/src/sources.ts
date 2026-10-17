// Gemini is asked to finish every answer with one machine-readable line, e.g.
//   SOURCES: quran 2:255; quran 112:1-4; nawawi 1; bukhari 52
// The line is stripped from the text the user sees, and each reference is
// checked against the real data before it reaches the app, so a made-up verse
// or hadith number never shows up as a "source".

export type SourceRef =
  | { kind: "quran"; surah: number; from: number; to: number }
  | { kind: "hadith"; collection: "bukhari" | "muslim" | "nawawi"; number: number };

const MAX_REFS = 4;
const SOURCES_LINE = /^[ \t>*_-]*sources?[ \t]*:[ \t]*(.*?)[ \t]*$/im;
const QURAN_REF = /^quran\s+(\d{1,3}):(\d{1,3})(?:\s*-\s*(\d{1,3}))?$/i;
const HADITH_REF = /^(bukhari|muslim|nawawi)\s+(\d{1,5})$/i;

export function splitSources(reply: string): { text: string; refs: SourceRef[] } {
  const lines = reply.split(/\r?\n/);
  let index = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (SOURCES_LINE.test(lines[i])) {
      index = i;
      break;
    }
  }
  if (index === -1) return { text: reply.trim(), refs: [] };

  const raw = (SOURCES_LINE.exec(lines[index])?.[1] ?? "").replace(/^[\s*_]+/, "");
  const text = [...lines.slice(0, index), ...lines.slice(index + 1)].join("\n").trim();

  const refs: SourceRef[] = [];
  const seen = new Set<string>();
  for (const token of raw.split(/[;,]/)) {
    const part = token.trim();
    let ref: SourceRef | null = null;

    const quran = QURAN_REF.exec(part);
    if (quran) {
      const from = Number(quran[2]);
      const to = quran[3] ? Number(quran[3]) : from;
      ref = { kind: "quran", surah: Number(quran[1]), from, to: Math.max(from, to) };
    }

    const hadith = HADITH_REF.exec(part);
    if (hadith) {
      ref = { kind: "hadith", collection: hadith[1].toLowerCase() as "bukhari" | "muslim" | "nawawi", number: Number(hadith[2]) };
    }

    if (!ref) continue;
    const key = JSON.stringify(ref);
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push(ref);
    if (refs.length === MAX_REFS) break;
  }

  return { text, refs };
}

export function quranRefIsReal(ref: Extract<SourceRef, { kind: "quran" }>, versesCount: number | undefined): boolean {
  return (
    Number.isInteger(ref.surah) &&
    ref.surah >= 1 &&
    ref.surah <= 114 &&
    versesCount !== undefined &&
    ref.from >= 1 &&
    ref.to <= versesCount
  );
}

export function quranLabel(name: string, ref: Extract<SourceRef, { kind: "quran" }>): string {
  return `${name} ${ref.surah}:${ref.from}${ref.to > ref.from ? `-${ref.to}` : ""}`;
}
