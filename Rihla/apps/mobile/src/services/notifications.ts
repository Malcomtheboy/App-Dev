import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Local (device-only) notifications — no push server involved. Scheduling and
// permissions simply don't exist on web, so every export here is a safe no-op
// there instead of throwing, so screens can call these unconditionally.
export const notificationsSupported = Platform.OS !== 'web';

if (notificationsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

// Schedules (or re-schedules) a notification that repeats every day at the given
// local time. `id` identifies the reminder so toggling it off can cancel the
// right one, and toggling it back on doesn't stack duplicates.
export async function scheduleDailyReminder(options: {
  id: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
}): Promise<boolean> {
  if (!notificationsSupported) return false;
  const granted = await ensureNotificationPermission();
  if (!granted) return false;

  await cancelReminder(options.id);

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: options.id,
      content: { title: options.title, body: options.body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: options.hour,
        minute: options.minute,
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelReminder(id: string): Promise<void> {
  if (!notificationsSupported) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Nothing was scheduled under this id — nothing to cancel.
  }
}

// A single, immediate "well done" style notification — used when a goal is completed.
export async function sendCelebration(title: string, body: string): Promise<void> {
  if (!notificationsSupported) return;
  const granted = await ensureNotificationPermission();
  if (!granted) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  } catch {
    // Best-effort — a missed celebration notification isn't worth surfacing an error for.
  }
}
