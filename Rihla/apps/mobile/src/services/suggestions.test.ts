/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSuggestion, nextArabicStep } from './suggestions';

const levels = [
  { key: 'letters', title: 'Letters', href: '/arabic/letters', total: 28 },
  { key: 'harakat', title: 'Harakat', href: '/arabic/harakat', total: 4 },
  { key: 'words', title: 'Words', href: '/arabic/words', total: 12 },
];

test('the next Arabic step is the first level with something left', () => {
  assert.deepEqual(nextArabicStep(levels, {}), { title: 'Letters', href: '/arabic/letters', learned: 0, total: 28 });
  assert.equal(nextArabicStep(levels, { letters: 28, harakat: 1 })?.title, 'Harakat');
  assert.equal(nextArabicStep(levels, { letters: 28, harakat: 4, words: 3 })?.learned, 3);
});

test('there is no next step once every level is complete', () => {
  assert.equal(nextArabicStep(levels, { letters: 28, harakat: 4, words: 12 }), null);
});

test('a new Muslim is pointed at the alphabet first', () => {
  const step = nextArabicStep(levels, {});
  const suggestion = buildSuggestion('new', step);
  assert.equal(suggestion.href, '/arabic/letters');
  assert.match(suggestion.title, /alphabet/i);
});

test('once Arabic has been started, the suggestion shows progress', () => {
  const suggestion = buildSuggestion('beginner', nextArabicStep(levels, { letters: 10 }));
  assert.equal(suggestion.href, '/arabic/letters');
  assert.match(suggestion.title, /keep going/i);
  assert.match(suggestion.subtitle, /10 of 28/);
});

test('advanced users are sent to hadith, not to the alphabet', () => {
  assert.equal(buildSuggestion('advanced', nextArabicStep(levels, {})).href, '/hadith/nawawi');
});

test('with Arabic finished, a new Muslim is pointed at the Guide and others at hadith', () => {
  assert.equal(buildSuggestion('new', null).href, '/chat');
  assert.equal(buildSuggestion('beginner', null).href, '/hadith/nawawi');
});
