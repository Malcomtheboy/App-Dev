/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeLevel, computeStreak, weekRate } from './stats-math';

process.env.TZ = 'Europe/Oslo';

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d, 14, 0);

test('streak counts consecutive days ending today', () => {
  const dates = new Set(['2026-10-12', '2026-10-13', '2026-10-14']);
  assert.equal(computeStreak(dates, day(2026, 10, 14)), 3);
});

test('streak is not broken just because today has no activity yet', () => {
  const dates = new Set(['2026-10-12', '2026-10-13']);
  assert.equal(computeStreak(dates, day(2026, 10, 14)), 2);
});

test('a missed day ends the streak', () => {
  const dates = new Set(['2026-10-10', '2026-10-13', '2026-10-14']);
  assert.equal(computeStreak(dates, day(2026, 10, 14)), 2);
  assert.equal(computeStreak(new Set(['2026-10-10']), day(2026, 10, 14)), 0);
  assert.equal(computeStreak(new Set(), day(2026, 10, 14)), 0);
});

test('streak runs across month, year and daylight-saving boundaries', () => {
  assert.equal(computeStreak(new Set(['2025-12-30', '2025-12-31', '2026-01-01']), day(2026, 1, 1)), 3);
  assert.equal(computeStreak(new Set(['2026-10-24', '2026-10-25', '2026-10-26']), day(2026, 10, 26)), 3);
});

test('level goes up every five completions', () => {
  assert.equal(computeLevel(0), 1);
  assert.equal(computeLevel(4), 1);
  assert.equal(computeLevel(5), 2);
  assert.equal(computeLevel(12), 3);
  assert.equal(computeLevel(-3), 1);
});

test('weekRate is the share of possible actions done so far', () => {
  assert.equal(weekRate([5, 0, 0, 0, 0, 0, 0], 1, 5), 100);
  assert.equal(weekRate([5, 3, 0, 0, 0, 0, 0], 2, 5), 80);
  assert.equal(weekRate([3, 0, 0, 0, 0, 0, 0], 3, 5), 20);
});

test('weekRate only looks at elapsed days, is clamped, and handles empty input', () => {
  assert.equal(weekRate([2, 5, 5, 5, 5, 5, 5], 1, 5), 40);
  assert.equal(weekRate([9, 9], 2, 5), 100);
  assert.equal(weekRate([1, 1], 0, 5), 0);
  assert.equal(weekRate([1, 1], 2, 0), 0);
});
