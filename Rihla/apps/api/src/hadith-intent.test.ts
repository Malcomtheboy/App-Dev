import assert from "node:assert/strict";
import { test } from "node:test";
import { detectHadithIntent } from "./hadith-intent.js";

const reference = (collection: string, number: number) => ({ kind: "reference", collection, number });
const topic = (query: string) => ({ kind: "topic", query });

test("plain lookups of a numbered hadith are recognised", () => {
  assert.deepEqual(detectHadithIntent("Bukhari 52"), reference("bukhari", 52));
  assert.deepEqual(detectHadithIntent("show me nawawi hadith 12"), reference("nawawi", 12));
  assert.deepEqual(detectHadithIntent("Sahih Muslim 1907"), reference("muslim", 1907));
  assert.deepEqual(detectHadithIntent("hadith number 5 in Sahih al-Bukhari"), reference("bukhari", 5));
  assert.deepEqual(detectHadithIntent("What is 40 hadith Nawawi #3?"), reference("nawawi", 3));
  assert.deepEqual(detectHadithIntent("read hadith 7 from an-nawawi please"), reference("nawawi", 7));
});

test("topic requests are recognised in the common phrasings", () => {
  assert.deepEqual(detectHadithIntent("show me hadith about patience"), topic("patience"));
  assert.deepEqual(detectHadithIntent("Hadith on honesty?"), topic("honesty"));
  assert.deepEqual(detectHadithIntent("Can you find some hadiths about the neighbours please"), topic("neighbours"));
  assert.deepEqual(detectHadithIntent("find hadiths about the neighbours"), topic("neighbours"));
  assert.deepEqual(detectHadithIntent("are there any hadith about fasting"), topic("fasting"));
  assert.deepEqual(detectHadithIntent("What is the hadith about intentions?"), topic("intentions"));
  assert.deepEqual(detectHadithIntent("what hadith do you have on charity"), topic("charity"));
});

test("anything asking for meaning, a reason or a ruling goes to the AI", () => {
  assert.equal(detectHadithIntent("What does Bukhari 1 mean?"), null);
  assert.equal(detectHadithIntent("Explain nawawi hadith 1"), null);
  assert.equal(detectHadithIntent("Is Bukhari 52 authentic?"), null);
  assert.equal(detectHadithIntent("hadith about why we fast"), null);
  assert.equal(detectHadithIntent("Is it haram to skip fasting? show me hadith about fasting"), null);
  assert.equal(detectHadithIntent("show me hadith about how to pray"), null);
});

test("ordinary questions are not mistaken for lookups", () => {
  assert.equal(detectHadithIntent("How do I make wudu?"), null);
  assert.equal(detectHadithIntent("How many times must a Muslim pray 5"), null);
  assert.equal(detectHadithIntent("Muslim 5"), null);
  assert.equal(detectHadithIntent("Who was Imam Bukhari 52 years old"), null);
  assert.equal(detectHadithIntent("Tell me about Surah Al-Ikhlas"), null);
  assert.equal(detectHadithIntent("hadith"), null);
});

test("lookups with extra words, several numbers, or no number fall through", () => {
  assert.equal(detectHadithIntent("compare bukhari 1 and bukhari 2"), null);
  assert.equal(detectHadithIntent("bukhari"), null);
  assert.equal(detectHadithIntent("bukhari 0"), null);
  assert.equal(detectHadithIntent("bukhari 123456"), null);
});

test("too-long or too-vague topics fall through", () => {
  assert.equal(detectHadithIntent("hadith about the best way for a person to spend their evening"), null);
  assert.equal(detectHadithIntent("hadith about it"), null);
  assert.equal(detectHadithIntent(`hadith about ${"word ".repeat(40)}`), null);
});
