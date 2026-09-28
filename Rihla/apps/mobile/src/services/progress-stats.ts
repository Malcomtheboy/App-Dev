import AsyncStorage from '@react-native-async-storage/async-storage';

const DATES_KEY = 'rihla:activityDates';
const COMPLETIONS_KEY = 'rihla:totalCompletions';

function today() {
  return new Date();
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

// Call this once per goal-completion tap. Records today as an "active" day
// (for the streak) and bumps the lifetime completion count (for the level).
export async function recordCompletion(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(DATES_KEY);
    const dates: string[] = raw ? JSON.parse(raw) : [];
    const todayKey = dateKey(today());
    if (!dates.includes(todayKey)) {
      dates.push(todayKey);
      await AsyncStorage.setItem(DATES_KEY, JSON.stringify(dates));
    }

    const rawCount = await AsyncStorage.getItem(COMPLETIONS_KEY);
    const count = rawCount ? Number(rawCount) : 0;
    await AsyncStorage.setItem(COMPLETIONS_KEY, String(count + 1));
  } catch {
    // Best-effort — worst case this one action doesn't count toward stats.
  }
}

export type ProgressStats = { streak: number; level: number; completions: number };

// A day streak counts consecutive active days ending today. If today has no
// activity yet, it checks from yesterday instead, so the streak doesn't look
// broken before you've had a chance to do anything today.
export async function getProgressStats(): Promise<ProgressStats> {
  try {
    const [rawDates, rawCount] = await Promise.all([
      AsyncStorage.getItem(DATES_KEY),
      AsyncStorage.getItem(COMPLETIONS_KEY),
    ]);
    const dates = new Set<string>(rawDates ? JSON.parse(rawDates) : []);
    const completions = rawCount ? Number(rawCount) : 0;

    let streak = 0;
    const cursor = today();
    if (!dates.has(dateKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (dates.has(dateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const level = Math.floor(completions / 5) + 1;
    return { streak, level, completions };
  } catch {
    return { streak: 0, level: 1, completions: 0 };
  }
}
