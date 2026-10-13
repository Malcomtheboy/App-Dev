import { arabicLetters } from "@mobile-data/arabic-letters";
import { arabicSentences } from "@mobile-data/arabic-sentences";
import { arabicWords } from "@mobile-data/arabic-words";
import { harakatList } from "@mobile-data/harakat";

export { arabicLetters, arabicSentences, arabicWords, harakatList };

// The four vowel marks the Harakat level teaches: fatha, damma, kasra, sukun.
const TAUGHT_MARKS = new Set(["َ", "ُ", "ِ", "ْ"]);
const ARABIC_MARK = /[ً-ٰٟ]/;
const LETTERS = new Set(arabicLetters.map((letter) => letter.isolated));
const DEMONSTRATIVES = new Set(["هَذَا", "هَذِهِ"]);

function baseLetters(text: string) {
  return [...text].filter((char) => !ARABIC_MARK.test(char) && char !== " ");
}

function marks(text: string) {
  return [...text].filter((char) => ARABIC_MARK.test(char));
}

export type Check = { label: string; passed: boolean; detail?: string };

// The learning order is the whole point of the curriculum — a word shouldn't
// use a letter or vowel mark the learner hasn't been taught yet. These checks
// catch that whenever someone edits the lesson files.
export function runCurriculumChecks(): Check[] {
  const checks: Check[] = [];

  const unknownLetters = arabicWords.flatMap((word) =>
    baseLetters(word.word)
      .filter((char) => !LETTERS.has(char))
      .map((char) => `${word.transliteration}: ${char}`)
  );
  checks.push({
    label: "Words only use letters from the alphabet level",
    passed: unknownLetters.length === 0,
    detail: unknownLetters.join(", "),
  });

  const untaughtMarks = [...arabicWords.map((w) => ({ id: w.transliteration, text: w.word })), ...arabicSentences.map((s) => ({ id: s.transliteration, text: s.sentence }))]
    .filter((item) => marks(item.text).some((mark) => !TAUGHT_MARKS.has(mark)))
    .map((item) => item.id);
  checks.push({
    label: "Words and sentences only use the four taught vowel marks (no tanween or shadda)",
    passed: untaughtMarks.length === 0,
    detail: untaughtMarks.join(", "),
  });

  const brokenParts = arabicWords.filter((word) => baseLetters(word.parts.join("")).join("") !== baseLetters(word.word).join("")).map((word) => word.transliteration);
  checks.push({
    label: "Each word's sound-it-out parts spell the same letters as the word",
    passed: brokenParts.length === 0,
    detail: brokenParts.join(", "),
  });

  const knownNouns = new Set(arabicWords.map((word) => word.word));
  const strayNouns = arabicSentences.filter((sentence) => !knownNouns.has(sentence.parts[1])).map((sentence) => sentence.transliteration);
  checks.push({
    label: "Every sentence is built from a noun taught in the Words level",
    passed: strayNouns.length === 0,
    detail: strayNouns.join(", "),
  });

  const badDemonstrative = arabicSentences.filter((sentence) => !DEMONSTRATIVES.has(sentence.parts[0]) || !sentence.transliteration.startsWith(sentence.parts[0] === "هَذَا" ? "hādhā" : "hādhihi")).map((sentence) => sentence.transliteration);
  checks.push({
    label: "Every sentence starts with hādhā or hādhihi, and the transliteration matches",
    passed: badDemonstrative.length === 0,
    detail: badDemonstrative.join(", "),
  });

  const duplicateIds = [arabicLetters, harakatList, arabicWords, arabicSentences].filter((list) => new Set(list.map((item) => item.id)).size !== list.length).length;
  checks.push({ label: "Item ids are unique within each level", passed: duplicateIds === 0 });

  return checks;
}
