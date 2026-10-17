/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDays, dateKey, daysElapsedThisWeek, startOfWeek } from './date-key';

// Oslo observes daylight saving, which is where day maths usually goes wrong
// (a day is 25h when the clocks go back, 23h when they go forward).
process.env.TZ = 'Europe/Oslo';

test('dateKey is the local calendar date, zero-padded', () => {
  assert.equal(dateKey(new Date(2026, 0, 5, 0, 30)), '2026-01-05');
  assert.equal(dateKey(new Date(2026, 11, 31, 23, 59)), '2026-12-31');
});

test('startOfWeek is the Monday at local midnight', () => {
  assert.equal(dateKey(startOfWeek(new Date(2026, 9, 14, 15, 0))), '2026-10-12'); // Wednesday
  assert.equal(dateKey(startOfWeek(new Date(2026, 9, 12, 0, 5))), '2026-10-12'); // the Monday itself
  assert.equal(dateKey(startOfWeek(new Date(2026, 9, 18, 23, 0))), '2026-10-12'); // Sunday belongs to the week before
  const start = startOfWeek(new Date(2026, 9, 14, 15, 0));
  assert.equal(start.getHours(), 0);
  assert.equal(start.getMinutes(), 0);
});

test('addDays walks calendar days across month and year ends', () => {
  assert.equal(dateKey(addDays(new Date(2026, 0, 30, 12), 3)), '2026-02-02');
  assert.equal(dateKey(addDays(new Date(2026, 0, 2, 12), -3)), '2025-12-30');
});

test('daysElapsedThisWeek counts Monday as day 1 and Sunday as day 7', () => {
  assert.equal(daysElapsedThisWeek(new Date(2026, 9, 12, 8, 0)), 1);
  assert.equal(daysElapsedThisWeek(new Date(2026, 9, 14, 12, 0)), 3);
  assert.equal(daysElapsedThisWeek(new Date(2026, 9, 18, 23, 30)), 7);
});

test('daysElapsedThisWeek stays 7 on the Sunday the clocks go back (25-hour day)', () => {
  assert.equal(daysElapsedThisWeek(new Date(2026, 9, 25, 23, 30)), 7);
  assert.equal(daysElapsedThisWeek(new Date(2026, 9, 25, 0, 30)), 7);
});

test('daysElapsedThisWeek stays correct around the spring change (23-hour day)', () => {
  assert.equal(daysElapsedThisWeek(new Date(2026, 2, 29, 23, 30)), 7);
  assert.equal(daysElapsedThisWeek(new Date(2026, 2, 30, 0, 10)), 1);
});
