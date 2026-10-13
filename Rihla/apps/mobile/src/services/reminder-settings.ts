import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Prayer } from './prayer-log';

const KEY = 'rihla:reminderSettings';

export type ReminderSettings = {
  prayers: Record<Prayer, boolean>;
  dailyVerse: boolean;
  streakAlert: boolean;
};

export const defaultReminderSettings: ReminderSettings = {
  prayers: { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false },
  dailyVerse: false,
  streakAlert: false,
};

export async function loadReminderSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return defaultReminderSettings;
    const saved = JSON.parse(raw);
    return {
      prayers: { ...defaultReminderSettings.prayers, ...saved.prayers },
      dailyVerse: !!saved.dailyVerse,
      streakAlert: !!saved.streakAlert,
    };
  } catch {
    return defaultReminderSettings;
  }
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Best-effort — the scheduled notification itself still exists on the device.
  }
}
