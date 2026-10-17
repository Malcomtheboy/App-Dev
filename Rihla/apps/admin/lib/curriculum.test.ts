import assert from "node:assert/strict";
import { test } from "node:test";
import { arabicLetters, arabicSentences, arabicWords, harakatList, runCurriculumChecks } from "./curriculum";

// Fails the build if anyone edits the lessons in apps/mobile/src/data so that
// something is taught before the letters or vowel marks it relies on.
test("every curriculum order check passes", () => {
  const failed = runCurriculumChecks().filter((check) => !check.passed);
  assert.deepEqual(
    failed.map((check) => `${check.label}: ${check.detail ?? ""}`),
    [],
  );
});

test("the curriculum has the expected size", () => {
  assert.equal(arabicLetters.length, 28);
  assert.equal(harakatList.length, 4);
  assert.ok(arabicWords.length > 0);
  assert.ok(arabicSentences.length > 0);
});
