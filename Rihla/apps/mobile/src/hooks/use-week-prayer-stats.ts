import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { addDays, daysElapsedThisWeek, startOfWeek } from '@/services/date-key';
import { getDailyPrayerCounts, PRAYERS } from '@/services/prayer-log';

export type WeekPrayerStats = {
  counts: number[]; // prayers checked off, Monday..Sunday
  todayIndex: number; // 0 = Monday
  score: number; // % of prayers done out of those possible so far this week
  delta: number | null; // score minus last week's final score, in points; null if last week has no data
};

const empty: WeekPrayerStats = { counts: [0, 0, 0, 0, 0, 0, 0], todayIndex: 0, score: 0, delta: null };

function rate(counts: number[], days: number) {
  if (days <= 0) return 0;
  const done = counts.slice(0, days).reduce((sum, count) => sum + count, 0);
  return Math.round((done / (days * PRAYERS.length)) * 100);
}

// Shared by Home and Progress so their weekly charts always agree.
export function useWeekPrayerStats() {
  const [stats, setStats] = useState<WeekPrayerStats>(empty);

  const refresh = useCallback(async () => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const elapsed = daysElapsedThisWeek(now);
    const [thisWeek, lastWeek] = await Promise.all([
      getDailyPrayerCounts(weekStart, 7),
      getDailyPrayerCounts(addDays(weekStart, -7), 7),
    ]);
    const score = rate(thisWeek, elapsed);
    const lastWeekHasData = lastWeek.some((count) => count > 0);
    setStats({
      counts: thisWeek,
      todayIndex: elapsed - 1,
      score,
      delta: lastWeekHasData ? score - rate(lastWeek, 7) : null,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { ...stats, refresh };
}
