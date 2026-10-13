import type { PrayerTimes } from 'adhan';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  cancelReminder,
  ensureNotificationPermission,
  notificationsSupported,
  scheduleDailyReminder,
} from '@/services/notifications';
import { PRAYERS, type Prayer } from '@/services/prayer-log';
import {
  defaultReminderSettings,
  loadReminderSettings,
  saveReminderSettings,
  type ReminderSettings,
} from '@/services/reminder-settings';

export type ReminderResult = 'ok' | 'denied' | 'no-times';

const DAILY = {
  dailyVerse: {
    id: 'daily-verse',
    title: 'Your daily ayah',
    body: 'One verse to reflect on. Open Rihla to read it.',
    hour: 7,
    minute: 30,
  },
  streakAlert: {
    id: 'streak-alert',
    title: 'Keep your streak going',
    body: 'A small step today keeps your streak alive.',
    hour: 20,
    minute: 30,
  },
} as const;

// Hour:minute of each prayer as one primitive string, so effects can depend on
// "did today's times actually change" rather than on the PrayerTimes object,
// which is rebuilt on every clock tick.
function timeSlots(times: PrayerTimes | null): string {
  if (!times) return '';
  return PRAYERS.map((prayer) => {
    const at = times[prayer.toLowerCase() as 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'];
    return `${at.getHours()}:${at.getMinutes()}`;
  }).join(',');
}

// One source of truth for every reminder switch in the app (Progress'
// Reminders sheet and Profile's Notifications sheet), persisted so the
// switches match what is actually scheduled on the device.
export function useReminders(times: PrayerTimes | null) {
  const [settings, setSettings] = useState<ReminderSettings>(defaultReminderSettings);
  const [loaded, setLoaded] = useState(false);
  const slots = timeSlots(times);
  const enabledPrayers = PRAYERS.filter((prayer) => settings.prayers[prayer]).join(',');

  const reload = useCallback(() => {
    loadReminderSettings()
      .then(setSettings)
      .finally(() => setLoaded(true));
  }, []);
  useFocusEffect(reload);

  // Prayer times shift a minute or two every day, but a repeating notification
  // keeps the time it was created with — so re-create the enabled ones whenever
  // today's calculated times differ from what was last scheduled.
  useEffect(() => {
    if (!loaded || !slots || !notificationsSupported) return;
    const parts = slots.split(',');
    enabledPrayers
      .split(',')
      .filter(Boolean)
      .forEach((name) => {
        const [hour, minute] = parts[PRAYERS.indexOf(name as Prayer)].split(':').map(Number);
        void scheduleDailyReminder({
          id: `prayer-${name}`,
          title: `${name} reminder`,
          body: `It's time for ${name}.`,
          hour,
          minute,
          playAdhan: true,
        });
      });
  }, [loaded, slots, enabledPrayers]);

  const update = useCallback((change: (current: ReminderSettings) => ReminderSettings) => {
    setSettings((current) => {
      const next = change(current);
      void saveReminderSettings(next);
      return next;
    });
  }, []);

  const setPrayer = useCallback(
    async (prayer: Prayer, on: boolean): Promise<ReminderResult> => {
      if (on) {
        if (notificationsSupported) {
          if (!slots) return 'no-times';
          if (!(await ensureNotificationPermission())) return 'denied';
        }
      } else {
        await cancelReminder(`prayer-${prayer}`);
      }
      update((current) => ({ ...current, prayers: { ...current.prayers, [prayer]: on } }));
      return 'ok';
    },
    [slots, update]
  );

  const setAllPrayers = useCallback(
    async (on: boolean): Promise<ReminderResult> => {
      if (on && notificationsSupported) {
        if (!slots) return 'no-times';
        if (!(await ensureNotificationPermission())) return 'denied';
      }
      if (!on) await Promise.all(PRAYERS.map((prayer) => cancelReminder(`prayer-${prayer}`)));
      update((current) => ({
        ...current,
        prayers: Object.fromEntries(PRAYERS.map((prayer) => [prayer, on])) as Record<Prayer, boolean>,
      }));
      return 'ok';
    },
    [slots, update]
  );

  const setDaily = useCallback(
    async (key: 'dailyVerse' | 'streakAlert', on: boolean): Promise<ReminderResult> => {
      const reminder = DAILY[key];
      if (on) {
        if (notificationsSupported && !(await scheduleDailyReminder(reminder))) return 'denied';
      } else {
        await cancelReminder(reminder.id);
      }
      update((current) => ({ ...current, [key]: on }));
      return 'ok';
    },
    [update]
  );

  return { settings, loaded, setPrayer, setAllPrayers, setDaily };
}
