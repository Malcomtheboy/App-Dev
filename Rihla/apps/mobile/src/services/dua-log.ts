import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, dateKey } from './date-key';

const KEY = 'rihla:duaDates';

async function readDates(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export async function isDuaDoneToday(): Promise<boolean> {
  const dates = await readDates();
  return dates.has(dateKey(new Date()));
}

export async function markDuaDone(): Promise<void> {
  const dates = await readDates();
  dates.add(dateKey(new Date()));
  await AsyncStorage.setItem(KEY, JSON.stringify([...dates]));
}

// % of days in [weekStart, weekStart + daysElapsed) marked done.
export async function getDuaConsistency(weekStart: Date, daysElapsed: number): Promise<number> {
  if (daysElapsed <= 0) return 0;
  const dates = await readDates();
  let doneDays = 0;
  for (let i = 0; i < daysElapsed; i++) {
    if (dates.has(dateKey(addDays(weekStart, i)))) doneDays += 1;
  }
  return Math.round((doneDays / daysElapsed) * 100);
}
