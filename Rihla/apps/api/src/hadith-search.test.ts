import assert from "node:assert/strict";
import { test } from "node:test";
import { excerptAround, normalizeQuery, searchHadiths, type SearchableEdition } from "./hadith-search.js";

const editions: SearchableEdition[] = [
  {
    collection: "bukhari",
    name: "Sahih al-Bukhari",
    hadiths: [
      { hadithnumber: 1, text: "Actions are judged by intentions, and every person gets what he intended.", reference: { book: 1 } },
      { hadithnumber: 2, text: "The Prophet said: be mindful of prayer at its time.", reference: { book: 2 } },
      { hadithnumber: 3, reference: { book: 2 } },
    ],
  },
  {
    collection: "nawawi",
    name: "40 Hadith Nawawi",
    hadiths: [
      { hadithnumber: 1, text: "Actions are by intentions; intentions matter. Intentions intentions.", reference: { book: 1 } },
      { hadithnumber: 9, text: "Leave what I forbid; perform prayer.", reference: { book: 1 } },
    ],
  },
];

test("queries are trimmed and must be 3 to 60 characters of text", () => {
  assert.equal(normalizeQuery("  prayer   time "), "prayer time");
  assert.equal(normalizeQuery("hi"), null);
  assert.equal(normalizeQuery("x".repeat(61)), null);
  assert.equal(normalizeQuery(["prayer"]), null);
  assert.equal(normalizeQuery(undefined), null);
});

test("a hadith must contain every word, in any order, ignoring case", () => {
  const { total, results } = searchHadiths(editions, "INTENTIONS actions");
  assert.equal(total, 2);
  assert.deepEqual(results.map((hit) => `${hit.collection}:${hit.number}`).sort(), ["bukhari:1", "nawawi:1"]);
  assert.equal(searchHadiths(editions, "prayer intentions").total, 0);
});

test("results across collections carry their section and collection name", () => {
  const hit = searchHadiths(editions, "prayer").results.find((entry) => entry.collection === "nawawi");
  assert.deepEqual(hit && [hit.collectionName, hit.number, hit.section], ["40 Hadith Nawawi", 9, 1]);
});

test("whole-phrase matches rank above scattered ones, even with fewer mentions", () => {
  const ranked: SearchableEdition[] = [
    {
      collection: "x",
      name: "X",
      hadiths: [
        { hadithnumber: 1, text: "beta comes first, then alpha, beta again, alpha again, beta", reference: { book: 1 } },
        { hadithnumber: 2, text: "an alpha beta pair", reference: { book: 1 } },
      ],
    },
  ];
  assert.deepEqual(searchHadiths(ranked, "alpha beta").results.map((hit) => hit.number), [2, 1]);
});

test("equally good matches put the shorter text first", () => {
  const { results } = searchHadiths(editions, "actions are");
  assert.deepEqual(results.map((hit) => `${hit.collection}:${hit.number}`), ["nawawi:1", "bukhari:1"]);
});

test("the limit caps results but total still counts every match", () => {
  const { total, results } = searchHadiths(editions, "prayer", 1);
  assert.equal(total, 2);
  assert.equal(results.length, 1);
});

test("entries without text are ignored", () => {
  assert.equal(searchHadiths(editions, "bukhari").total, 0);
});

test("long texts are cut to a window around the match with ellipses", () => {
  const long = `${"a ".repeat(200)}needle${" b".repeat(200)}`;
  const excerpt = excerptAround(long, long.indexOf("needle"), 6);
  assert.ok(excerpt.includes("needle"));
  assert.ok(excerpt.startsWith("…") && excerpt.endsWith("…"));
  assert.ok(excerpt.length <= 175);
  assert.equal(excerptAround("short text", 0, 5), "short text");
});
