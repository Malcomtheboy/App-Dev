import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Local (device-only) notifications — no push server involved. Scheduling and
// permissions simply don't exist on web, so every export here is a safe no-op
// there instead of throwing, so screens can call these unconditionally.
export const notificationsSupported = Platform.OS !== 'web';

// "Beautiful adhan.ogg" by Adam-synagda, Wikimedia Commons, CC0 — trimmed to the
// opening ~25s (iOS caps custom notification sounds at 30s) and bundled via the
// expo-notifications config plugin in app.json.
const ADHAN_SOUND_FILE = 'adhan.wav';
const ADHAN_CHANNEL_ID = 'prayer-adhan';

if (notificationsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(ADHAN_CHANNEL_ID, {
      name: 'Prayer times',
      importance: Notifications.AndroidImportance.HIGH,
      sound: ADHAN_SOUND_FILE,
    }).catch(() => {
      // Falls back to the default channel/sound if this device rejects it.
    });
  }
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
// right one, and toggling it back on doesn't stack duplicates. `playAdhan` swaps
// the default chime for the call-to-prayer sound bundled in the app.
export async function scheduleDailyReminder(options: {
  id: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
  playAdhan?: boolean;
}): Promise<boolean> {
  if (!notificationsSupported) return false;
  const granted = await ensureNotificationPermission();
  if (!granted) return false;

  await cancelReminder(options.id);

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: options.id,
      content: {
        title: options.title,
        body: options.body,
        sound: options.playAdhan ? ADHAN_SOUND_FILE : true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: options.hour,
        minute: options.minute,
        channelId: options.playAdhan ? ADHAN_CHANNEL_ID : undefined,
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
