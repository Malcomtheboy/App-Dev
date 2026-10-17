import AsyncStorage from '@react-native-async-storage/async-storage';
import { dateKey } from './date-key';
import { computeLevel, computeStreak } from './stats-math';

const DATES_KEY = 'rihla:activityDates';
const COMPLETIONS_KEY = 'rihla:totalCompletions';

function today() {
  return new Date();
}

// Marks today as an "active" day for the streak, without touching the level.
// For lighter engagement like reading a verse or learning a letter.
export async function recordActivity(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(DATES_KEY);
    const dates: string[] = raw ? JSON.parse(raw) : [];
    const todayKey = dateKey(today());
    if (!dates.includes(todayKey)) {
      dates.push(todayKey);
      await AsyncStorage.setItem(DATES_KEY, JSON.stringify(dates));
    }
  } catch {
    // Best-effort — worst case today doesn't count toward the streak.
  }
}

// Call this once per finished action (a goal tap, a prayer checked off, a dua
// done). Records today as active and bumps the lifetime count behind the level.
export async function recordCompletion(): Promise<void> {
  await recordActivity();
  try {
    const rawCount = await AsyncStorage.getItem(COMPLETIONS_KEY);
    const count = rawCount ? Number(rawCount) : 0;
    await AsyncStorage.setItem(COMPLETIONS_KEY, String(count + 1));
  } catch {
    // Best-effort — worst case this one action doesn't count toward the level.
  }
}

// Undoes one completion (e.g. a prayer un-checked by mistake). The active day
// stays, since other activity may have happened on it.
export async function undoCompletion(): Promise<void> {
  try {
    const rawCount = await AsyncStorage.getItem(COMPLETIONS_KEY);
    const count = rawCount ? Number(rawCount) : 0;
    await AsyncStorage.setItem(COMPLETIONS_KEY, String(Math.max(0, count - 1)));
  } catch {
    // Best-effort.
  }
}

export type ProgressStats = { streak: number; level: number; completions: number };

export async function getProgressStats(): Promise<ProgressStats> {
  try {
    const [rawDates, rawCount] = await Promise.all([
      AsyncStorage.getItem(DATES_KEY),
      AsyncStorage.getItem(COMPLETIONS_KEY),
    ]);
    const dates = new Set<string>(rawDates ? JSON.parse(rawDates) : []);
    const completions = rawCount ? Number(rawCount) : 0;
    return { streak: computeStreak(dates, today()), level: computeLevel(completions), completions };
  } catch {
    return { streak: 0, level: 1, completions: 0 };
  }
}
