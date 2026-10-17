import { addDays, dateKey } from './date-key';

// Consecutive active days ending today. If today has no activity yet, counting
// starts from yesterday, so the streak doesn't look broken before the user has
// had a chance to do anything today.
export function computeStreak(activeDates: Set<string>, today: Date): number {
  let cursor = new Date(today);
  if (!activeDates.has(dateKey(cursor))) cursor = addDays(cursor, -1);
  let streak = 0;
  while (activeDates.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function computeLevel(completions: number): number {
  return Math.floor(Math.max(0, completions) / 5) + 1;
}

// % of the possible actions done over the first `days` entries of `counts`
// (one entry per day, each out of `perDay` possible).
export function weekRate(counts: number[], days: number, perDay: number): number {
  if (days <= 0 || perDay <= 0) return 0;
  const done = counts.slice(0, days).reduce((sum, count) => sum + count, 0);
  return Math.min(100, Math.round((done / (days * perDay)) * 100));
}
