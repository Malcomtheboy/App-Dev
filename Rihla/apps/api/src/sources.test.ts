import assert from "node:assert/strict";
import { test } from "node:test";
import { quranLabel, quranRefIsReal, splitSources } from "./sources.js";

test("splits the SOURCES line off the visible answer", () => {
  const { text, refs } = splitSources("Wudu starts with intention.\nSOURCES: quran 5:6; nawawi 1");
  assert.equal(text, "Wudu starts with intention.");
  assert.deepEqual(refs, [
    { kind: "quran", surah: 5, from: 6, to: 6 },
    { kind: "hadith", collection: "nawawi", number: 1 },
  ]);
});

test("parses verse ranges and ignores case and decoration", () => {
  const { refs } = splitSources("Answer.\n**Sources:** Quran 112:1-4, BUKHARI 52");
  assert.deepEqual(refs, [
    { kind: "quran", surah: 112, from: 1, to: 4 },
    { kind: "hadith", collection: "bukhari", number: 52 },
  ]);
});

test("'none' and missing lines give no sources and keep the text", () => {
  assert.deepEqual(splitSources("Just an answer.\nSOURCES: none"), { text: "Just an answer.", refs: [] });
  assert.deepEqual(splitSources("No sources line at all."), { text: "No sources line at all.", refs: [] });
});

test("drops unknown formats, duplicates, and caps at four references", () => {
  const { refs } = splitSources("A\nSOURCES: quran 1:1; quran 1:1; tirmidhi 5; quran x:y; quran 2:1; quran 3:1; quran 4:1; quran 5:1");
  assert.equal(refs.length, 4);
  assert.deepEqual(refs[0], { kind: "quran", surah: 1, from: 1, to: 1 });
  assert.ok(refs.every((ref) => ref.kind === "quran"));
});

test("a reversed range is normalised to a single verse", () => {
  const { refs } = splitSources("A\nSOURCES: quran 2:10-5");
  assert.deepEqual(refs, [{ kind: "quran", surah: 2, from: 10, to: 10 }]);
});

test("verse checks reject surahs and ayahs that do not exist", () => {
  const ref = (surah: number, from: number, to = from) => ({ kind: "quran" as const, surah, from, to });
  assert.equal(quranRefIsReal(ref(112, 1, 4), 4), true);
  assert.equal(quranRefIsReal(ref(112, 5), 4), false);
  assert.equal(quranRefIsReal(ref(115, 1), 7), false);
  assert.equal(quranRefIsReal(ref(0, 1), 7), false);
  assert.equal(quranRefIsReal(ref(1, 1), undefined), false);
});

test("labels show a range only when there is one", () => {
  assert.equal(quranLabel("Al-Ikhlas", { kind: "quran", surah: 112, from: 1, to: 4 }), "Al-Ikhlas 112:1-4");
  assert.equal(quranLabel("Al-Fatihah", { kind: "quran", surah: 1, from: 2, to: 2 }), "Al-Fatihah 1:2");
});
