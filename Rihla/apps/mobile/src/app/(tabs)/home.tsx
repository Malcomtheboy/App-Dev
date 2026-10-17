import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sheet } from '@/components/sheet';
import { usePrayerTimes } from '@/hooks/use-prayer-times';
import { useExperienceLevel } from '@/hooks/use-experience-level';
import { useProfile } from '@/hooks/use-profile';
import { useReminders } from '@/hooks/use-reminders';
import { useWeekPrayerStats } from '@/hooks/use-week-prayer-stats';
import { arabicLevels, getArabicProgress } from '@/services/arabic-progress';
import { isDuaDoneToday, markDuaDone } from '@/services/dua-log';
import { getTodayLog, markPrayerDone, PRAYERS, unmarkPrayerDone, type Prayer } from '@/services/prayer-log';
import { recordCompletion, undoCompletion } from '@/services/progress-stats';
import { buildSuggestion, nextArabicStep } from '@/services/suggestions';
import { formatClock, formatCountdown } from '@/services/time-format';
import { useTheme } from '@/theme/theme-context';

function formatDayKicker(date: Date) {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const month = date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  return `${weekday} · ${date.getDate()} ${month}`;
}

const duaOfTheDay = {
  arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
  translation:
    'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',
  source: 'Surah Al-Baqarah, 2:201',
};

type IconName = keyof typeof Ionicons.glyphMap;
type SheetKey = 'notifications' | 'lesson' | 'dua';
type LastRead = { surahId: number; surahName: string; verseKey: string; ayah: number; updatedAt: number };

export default function HomeScreen() {
  const { colors } = useTheme();
  const { times, now } = usePrayerTimes();
  const { initial } = useProfile();
  const { level } = useExperienceLevel();
  const [arabicProgress, setArabicProgress] = useState<Record<string, number>>({});
  const week = useWeekPrayerStats();
  const { settings: reminderSettings, setDaily } = useReminders(times);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const promoVisible = !promoDismissed && !reminderSettings.dailyVerse;
  const [sheet, setSheet] = useState<SheetKey | null>(null);
  const closeSheet = () => setSheet(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [todayLog, setTodayLog] = useState<Partial<Record<Prayer, { completedAt: number; onTime: boolean }>>>({});
  const [duaDone, setDuaDone] = useState(false);

  const loadLastRead = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('rihla:lastRead');
      setLastRead(saved ? JSON.parse(saved) : null);
    } catch (e) {
      console.error('Last Read:', e);
    }
  }, []);

  const loadToday = useCallback(async () => {
    const [log, dua, arabic] = await Promise.all([getTodayLog(), isDuaDoneToday(), getArabicProgress()]);
    setTodayLog(log);
    setDuaDone(dua);
    setArabicProgress(arabic);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLastRead();
      loadToday();
    }, [loadLastRead, loadToday])
  );

  const prayerTimeFor: Record<Prayer, Date | null> = times
    ? { Fajr: times.fajr, Dhuhr: times.dhuhr, Asr: times.asr, Maghrib: times.maghrib, Isha: times.isha }
    : { Fajr: null, Dhuhr: null, Asr: null, Maghrib: null, Isha: null };

  const togglePrayer = async (prayer: Prayer) => {
    if (todayLog[prayer]) {
      await unmarkPrayerDone(prayer);
      void undoCompletion();
    } else {
      void recordCompletion();
      const start = prayerTimeFor[prayer];
      const idx = PRAYERS.indexOf(prayer);
      const nextStart = prayerTimeFor[PRAYERS[idx + 1]];
      const end = nextStart ?? new Date(new Date().setHours(23, 59, 59, 999));
      const now = new Date();
      const onTime = !!start && now >= start && now < end;
      await markPrayerDone(prayer, onTime);
    }
    await Promise.all([loadToday(), week.refresh()]);
  };

  const handleMarkDua = async () => {
    await markDuaDone();
    void recordCompletion();
    setDuaDone(true);
  };

  const enableDailyReminder = async () => {
    const result = await setDaily('dailyVerse', true);
    if (result === 'denied') {
      Alert.alert('Notifications are off', 'Allow notifications for Rihla in Settings to get a daily reminder.');
    } else {
      Alert.alert('Reminder set', "We'll nudge you every morning at 07:30.");
    }
  };

  const suggestion = buildSuggestion(level, nextArabicStep(arabicLevels, arabicProgress));

  const prayersCompletedToday = PRAYERS.filter((p) => todayLog[p]).length;

  const nextKey = times?.nextPrayer(now);
  const nextTime = times && nextKey && nextKey !== 'none' ? times.timeForPrayer(nextKey) : null;
  const notifications: { title: string; time: string; icon: IconName }[] = [];
  if (nextTime && nextKey) {
    notifications.push({
      title: `${nextKey.charAt(0).toUpperCase()}${nextKey.slice(1)} in ${formatCountdown(nextTime.getTime() - now.getTime())}`,
      time: `At ${formatClock(nextTime)}`,
      icon: 'time-outline',
    });
  }
  if (!duaDone) notifications.push({ title: "Today's dua isn't marked yet", time: 'Tap Dua to read it', icon: 'hand-left-outline' });
  if (lastRead) notifications.push({ title: `Continue ${lastRead.surahName}`, time: `Ayah ${lastRead.ayah}`, icon: 'book-outline' });

  const runSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;
    router.push({ pathname: '/(tabs)/quran-hadith', params: { q: query } });
    setSearchQuery('');
  };

  const actions: { icon: IconName; label: string; featured?: boolean }[] = [
    { icon: 'time-outline', label: 'Prayer\ntimes', featured: true },
    { icon: 'book-outline', label: 'Quran' },
    { icon: 'hand-left-outline', label: 'Dua' },
    { icon: 'compass-outline', label: 'Qibla' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.accentTint, borderColor: colors.accent }]}>
            <Text style={[styles.avatarText, { color: colors.accent }]}>{initial}</Text>
          </View>
          <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={16} color={colors.textTertiary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={runSearch}
              placeholder="Search Rihla"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="search"
              style={[styles.searchText, styles.searchInput, { color: colors.textPrimary }]}
            />
          </View>
          <TouchableOpacity
            style={[styles.headerIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setSheet('notifications')}
          >
            <Ionicons name="notifications-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.kicker, { color: colors.accent }]}>{formatDayKicker(new Date())}</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Your day, in balance.</Text>

        <LinearGradient
          colors={colors.heroGradient as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { shadowColor: colors.heroShadow }]}
        >
          <Ionicons name="moon-outline" size={72} color="rgba(255,255,255,0.07)" style={styles.heroEmblem} />
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>PRAYER MOMENTUM</Text>
            <View style={styles.liveChip}>
              <View style={styles.liveDot} />
              <Text style={styles.liveChipText}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.heroNumber}>
            {prayersCompletedToday}<Text style={styles.heroSlash}> / {PRAYERS.length}</Text>
          </Text>
          <Text style={styles.heroCaption}>prayers completed today · tap to check off</Text>
          <View style={styles.prayerDots}>
            {PRAYERS.map((prayer) => {
              const done = !!todayLog[prayer];
              const isNext = !done && PRAYERS.findIndex((p) => !todayLog[p]) === PRAYERS.indexOf(prayer);
              return (
                <TouchableOpacity
                  key={prayer}
                  style={styles.prayerDotItem}
                  onPress={() => togglePrayer(prayer)}
                  accessibilityRole="button"
                  accessibilityLabel={`Mark ${prayer} ${done ? 'not done' : 'done'}`}
                >
                  <View style={[styles.dot, done ? styles.dotDone : isNext ? styles.dotNext : styles.dotTodo]} />
                  <Text style={styles.dotLabel}>{prayer}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>

        {promoVisible && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={enableDailyReminder}
            style={[styles.promo, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}
            accessibilityRole="button"
            accessibilityLabel="Set a daily reminder"
          >
            <TouchableOpacity style={styles.promoClose} onPress={() => setPromoDismissed(true)} accessibilityLabel="Dismiss">
              <Ionicons name="close" size={15} color={colors.textTertiary} />
            </TouchableOpacity>
            <View style={[styles.promoIcon, { backgroundColor: colors.accentTint }]}>
              <Ionicons name="sparkles-outline" size={17} color={colors.accent} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.promoTitle, { color: colors.textPrimary }]}>Your Quran streak, protected</Text>
              <Text style={[styles.promoText, { color: colors.textSecondary }]} numberOfLines={1}>
                Tap to set a daily reminder so you never miss a page.
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.quickRow}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickItem}
              onPress={() => {
                if (action.label === 'Qibla') router.push('/qibla');
                else if (action.label === 'Prayer\ntimes') router.push('/prayer-times');
                else if (action.label === 'Quran') router.push('/(tabs)/quran-hadith');
                else if (action.label === 'Dua') setSheet('dua');
              }}
              accessibilityRole="button"
              accessibilityLabel={action.label.replace('\n', ' ')}
            >
              <View
                style={[
                  styles.quickIcon,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  action.featured && { backgroundColor: colors.accentTint, borderColor: colors.accent },
                ]}
              >
                <Ionicons name={action.icon} size={20} color={action.featured ? colors.accent : colors.textSecondary} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.lesson, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow, marginTop: 22 }]}
          onPress={() => router.push(suggestion.href as any)}
          accessibilityRole="button"
          accessibilityLabel={suggestion.title}
        >
          <View style={[styles.lessonBadge, { backgroundColor: colors.accentTint, borderColor: colors.accent }]}>
            <Ionicons name={suggestion.icon} size={20} color={colors.accent} />
          </View>
          <View style={styles.lessonText}>
            <Text style={[styles.lessonOverline, { color: colors.textTertiary }]}>SUGGESTED FOR YOU</Text>
            <Text style={[styles.lessonTitle, { color: colors.textPrimary }]}>{suggestion.title}</Text>
            <Text style={[styles.lessonSub, { color: colors.textSecondary }]}>{suggestion.subtitle}</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>This week</Text>
        </View>
        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
          <View>
            <Text style={[styles.chartValue, { color: colors.textPrimary }]}>{week.score}%</Text>
            <Text style={[styles.chartCaption, { color: colors.textSecondary }]}>Prayer consistency</Text>
            <View style={styles.chartDelta}>
              <Ionicons
                name={week.delta === null ? 'sparkles-outline' : week.delta >= 0 ? 'trending-up' : 'trending-down'}
                size={12}
                color={week.delta === null ? colors.textTertiary : week.delta >= 0 ? colors.positive : colors.negative}
              />
              <Text
                style={[
                  styles.chartDeltaText,
                  { color: week.delta === null ? colors.textTertiary : week.delta >= 0 ? colors.positive : colors.negative },
                ]}
              >
                {week.delta === null ? 'First week tracked' : `${week.delta >= 0 ? '+' : ''}${week.delta}% vs last week`}
              </Text>
            </View>
          </View>
          <View style={styles.chart}>
            {week.counts.map((count, i) => (
              <View
                key={i}
                style={[styles.bar, { height: 8 + (count / PRAYERS.length) * 50, backgroundColor: i === week.todayIndex ? colors.accent : colors.border }]}
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Continue</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/quran-hadith')}>
            <Text style={[styles.sectionLink, { color: colors.accent }]}>See all</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.lesson, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}
          onPress={() =>
            lastRead
              ? router.push(`/quran/${lastRead.surahId}?ayah=${lastRead.ayah}` as any)
              : setSheet('lesson')
          }
        >
          <View style={[styles.lessonBadge, { backgroundColor: colors.accentTint, borderColor: colors.accent }]}>
            <Ionicons name="book-outline" size={20} color={colors.accent} />
          </View>
          <View style={styles.lessonText}>
            <Text style={[styles.lessonOverline, { color: colors.textTertiary }]}>
              {lastRead ? 'CONTINUE READING' : 'FOUNDATIONS · 05 MIN'}
            </Text>
            <Text style={[styles.lessonTitle, { color: colors.textPrimary }]}>
              {lastRead ? lastRead.surahName : 'The meaning of intention'}
            </Text>
            <Text style={[styles.lessonSub, { color: colors.textSecondary }]}>
              {lastRead ? `Ayah ${lastRead.ayah} · pick up where you left off` : 'Start where every act begins.'}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>

      </ScrollView>

      <Sheet visible={sheet === 'notifications'} onClose={closeSheet} title="Notifications">
        {notifications.length === 0 && (
          <Text style={[styles.lessonSub, { color: colors.textSecondary, paddingVertical: 12 }]}>
            You&apos;re all caught up.
          </Text>
        )}
        {notifications.map((item, index) => (
          <View
            key={item.title}
            style={[styles.notificationRow, index !== notifications.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
          >
            <View style={[styles.lessonBadge, { height: 36, width: 36, backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
              <Ionicons name={item.icon} size={16} color={colors.textSecondary} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.lessonTitle, { color: colors.textPrimary, fontSize: 13.5 }]}>{item.title}</Text>
              <Text style={[styles.lessonSub, { color: colors.textSecondary }]}>{item.time}</Text>
            </View>
          </View>
        ))}
      </Sheet>

      <Sheet visible={sheet === 'lesson'} onClose={closeSheet} title="The meaning of intention">
        <Text style={[styles.lessonOverline, { color: colors.accent, marginBottom: 10 }]}>FOUNDATIONS · 05 MIN</Text>
        <Text style={[styles.lessonBody, { color: colors.textPrimary }]}>
          The Prophet ﷺ said: &quot;Actions are judged by intentions, and every person will get what they intended.&quot;
        </Text>
        <Text style={[styles.lessonBody, { color: colors.textSecondary, marginTop: 12 }]}>
          Before any act of worship (prayer, fasting, charity), pause and renew your niyyah (intention). The same
          action can carry very different weight depending on why it was done. Sincerity is the foundation everything
          else is built on.
        </Text>
      </Sheet>

      <Sheet visible={sheet === 'dua'} onClose={closeSheet} title="Dua of the day">
        <Text style={[styles.duaArabic, { color: colors.textPrimary }]}>{duaOfTheDay.arabic}</Text>
        <Text style={[styles.lessonBody, { color: colors.textPrimary, marginTop: 14 }]}>{duaOfTheDay.translation}</Text>
        <Text style={[styles.lessonSub, { color: colors.textSecondary, marginTop: 10 }]}>{duaOfTheDay.source}</Text>
        <TouchableOpacity
          style={[
            styles.duaDoneButton,
            { borderColor: colors.accent, backgroundColor: duaDone ? colors.accentTint : 'transparent' },
          ]}
          onPress={handleMarkDua}
          disabled={duaDone}
        >
          <Ionicons name={duaDone ? 'checkmark-circle' : 'checkmark-circle-outline'} size={18} color={colors.accent} />
          <Text style={[styles.duaDoneButtonText, { color: colors.accent }]}>
            {duaDone ? 'Marked as done today' : 'Mark as done today'}
          </Text>
        </TouchableOpacity>
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 18, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatarText: { fontSize: 13, fontWeight: '700' },
  search: {
    height: 38,
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 13,
  },
  searchText: { fontSize: 13 },
  searchInput: { flex: 1, padding: 0 },
  headerIcon: { height: 38, width: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  kicker: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginTop: 30 },
  title: { fontSize: 30, fontWeight: '700', letterSpacing: -1, marginTop: 7, marginBottom: 22 },
  hero: {
    borderRadius: 26,
    padding: 22,
    overflow: 'hidden',
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  heroEmblem: { position: 'absolute', top: -10, right: -6 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: 'rgba(255,255,255,0.75)' },
  liveChip: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  liveDot: { height: 5, width: 5, borderRadius: 3, backgroundColor: '#FFFFFF' },
  liveChipText: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  heroNumber: { fontSize: 54, fontWeight: '700', letterSpacing: -3, color: '#FFFFFF', marginTop: 18 },
  heroSlash: { fontSize: 22, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  heroCaption: { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginTop: 5 },
  prayerDots: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  prayerDotItem: { alignItems: 'center', gap: 7 },
  dot: { height: 8, width: 8, borderRadius: 4 },
  dotDone: { backgroundColor: '#FFFFFF' },
  dotNext: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#FFFFFF' },
  dotTodo: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  dotLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '500' },
  promo: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  promoClose: { position: 'absolute', top: 10, right: 10, padding: 2 },
  promoIcon: { height: 38, width: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  promoTitle: { fontSize: 13, fontWeight: '700' },
  promoText: { fontSize: 11, marginTop: 3 },
  flex: { flex: 1 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  quickItem: { alignItems: 'center', gap: 8, width: 68 },
  quickIcon: { height: 52, width: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  quickLabel: { fontSize: 10, fontWeight: '500', textAlign: 'center', lineHeight: 13 },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 28,
    marginBottom: 11,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  sectionLink: { fontSize: 11.5, fontWeight: '600' },
  chartCard: {
    height: 128,
    borderRadius: 20,
    borderWidth: 1,
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  chartValue: { fontSize: 27, fontWeight: '700', letterSpacing: -1 },
  chartCaption: { fontSize: 11.5, marginTop: 3 },
  chartDelta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 9 },
  chartDeltaText: { fontSize: 10.5, fontWeight: '600' },
  chart: { height: 66, flexDirection: 'row', gap: 6, alignItems: 'flex-end' },
  bar: { width: 7, borderRadius: 4 },
  lesson: {
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 93,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  lessonBadge: { height: 44, width: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  lessonText: { flex: 1 },
  lessonOverline: { fontSize: 9, fontWeight: '700', letterSpacing: 0.7 },
  lessonTitle: { fontSize: 14.5, fontWeight: '600', marginTop: 4 },
  lessonSub: { fontSize: 11.5, marginTop: 3 },
  lessonBody: { fontSize: 14, lineHeight: 21 },
  notificationRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  duaArabic: { fontSize: 20, lineHeight: 34, textAlign: 'right', fontWeight: '600' },
  duaDoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    height: 48,
    marginTop: 20,
  },
  duaDoneButtonText: { fontSize: 13.5, fontWeight: '700' },
});
