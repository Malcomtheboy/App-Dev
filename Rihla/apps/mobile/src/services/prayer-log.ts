import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, dateKey } from './date-key';

const LOG_KEY = 'rihla:prayerLog';

export const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
export type Prayer = (typeof PRAYERS)[number];

type DayLog = Partial<Record<Prayer, { completedAt: number; onTime: boolean }>>;
type PrayerLog = Record<string, DayLog>;

async function readLog(): Promise<PrayerLog> {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function getTodayLog(): Promise<DayLog> {
  const log = await readLog();
  return log[dateKey(new Date())] ?? {};
}

// The caller works out `onTime` (it has the prayer-time window; we don't),
// falling back to false when prayer times aren't available (e.g. no location
// permission yet) rather than guessing.
export async function markPrayerDone(prayer: Prayer, onTime: boolean): Promise<void> {
  const log = await readLog();
  const key = dateKey(new Date());
  log[key] = { ...log[key], [prayer]: { completedAt: Date.now(), onTime } };
  await AsyncStorage.setItem(LOG_KEY, JSON.stringify(log));
}

export async function unmarkPrayerDone(prayer: Prayer): Promise<void> {
  const log = await readLog();
  const key = dateKey(new Date());
  if (log[key]?.[prayer]) {
    delete log[key][prayer];
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(log));
  }
}

// % of days in [weekStart, weekStart + daysElapsed) where Fajr was completed
// on time. A day with no Fajr entry counts as a miss for that day.
export async function getFajrOnTimeRate(weekStart: Date, daysElapsed: number): Promise<number> {
  if (daysElapsed <= 0) return 0;
  const log = await readLog();
  let onTimeDays = 0;
  for (let i = 0; i < daysElapsed; i++) {
    const key = dateKey(addDays(weekStart, i));
    if (log[key]?.Fajr?.onTime) onTimeDays += 1;
  }
  return Math.round((onTimeDays / daysElapsed) * 100);
}
