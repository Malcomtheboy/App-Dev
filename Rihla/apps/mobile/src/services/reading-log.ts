import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, dateKey } from './date-key';

const KEY = 'rihla:readingLog';

type ReadingLog = Record<string, string[]>; // dateKey -> distinct verseKeys read that day

async function readLog(): Promise<ReadingLog> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Called whenever the reader lands on a verse (scroll or audio), so we can
// count distinct verses read per day/week without a separate mushaf page API.
export async function recordVerseRead(verseKey: string): Promise<void> {
  try {
    const log = await readLog();
    const key = dateKey(new Date());
    const day = new Set(log[key] ?? []);
    day.add(verseKey);
    log[key] = [...day];
    await AsyncStorage.setItem(KEY, JSON.stringify(log));
  } catch {
    // Best-effort — worst case this read doesn't count toward the weekly total.
  }
}

export async function getVersesReadInRange(weekStart: Date, daysElapsed: number): Promise<number> {
  if (daysElapsed <= 0) return 0;
  const log = await readLog();
  const verses = new Set<string>();
  for (let i = 0; i < daysElapsed; i++) {
    const key = dateKey(addDays(weekStart, i));
    (log[key] ?? []).forEach((v) => verses.add(v));
  }
  return verses.size;
}
