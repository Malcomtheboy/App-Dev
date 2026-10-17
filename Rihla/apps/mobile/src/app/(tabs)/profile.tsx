import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { Sheet } from '@/components/sheet';
import { juzStarts } from '@/data/juz-starts';
import { useConnectedCircle } from '@/hooks/use-connected-circle';
import { useExperienceLevel } from '@/hooks/use-experience-level';
import { levelOptions } from '@/services/experience-level';
import { usePrayerTimes } from '@/hooks/use-prayer-times';
import { useProfile } from '@/hooks/use-profile';
import { useReminders, type ReminderResult } from '@/hooks/use-reminders';
import { PRAYERS } from '@/services/prayer-log';
import { auth } from '@/services/firebase';
import { getProgressStats, type ProgressStats } from '@/services/progress-stats';
import { useTheme } from '@/theme/theme-context';
import type { ThemePreference } from '@/theme/theme-context';

type IconName = keyof typeof Ionicons.glyphMap;
type SheetKey = 'badges' | 'appearance' | 'notifications' | 'location' | 'language' | 'level' | 'circles' | 'privacy' | 'help' | 'about';

type BadgeProgress = { finishedJuz1: boolean; goalCompleted: boolean; askedSomething: boolean };
const initialBadgeProgress: BadgeProgress = { finishedJuz1: false, goalCompleted: false, askedSomething: false };

const appearanceOptions: { key: ThemePreference; label: string; icon: IconName }[] = [
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export default function ProfileScreen() {
  const { colors, isDark, preference, setPreference } = useTheme();
  const { displayName, initial: avatarInitial, memberSince } = useProfile();
  const { level, setLevel } = useExperienceLevel();
  const levelTitle = levelOptions.find((option) => option.key === level)?.title ?? 'Beginner';

  const [sheet, setSheet] = useState<SheetKey | null>(null);
  const closeSheet = () => setSheet(null);

  const { times, place, loading: locating, message: locationError, retry: detectLocation } = usePrayerTimes();
  const { settings: reminderSettings, setAllPrayers, setDaily } = useReminders(times);
  const allPrayerRemindersOn = PRAYERS.every((prayer) => reminderSettings.prayers[prayer]);
  const location = place ?? (locating ? 'Locating…' : 'Not set');

  const { circle, addMember: addCircleMember } = useConnectedCircle();
  const [circleInput, setCircleInput] = useState('');

  const [progressStats, setProgressStats] = useState<ProgressStats>({ streak: 0, level: 1, completions: 0 });
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress>(initialBadgeProgress);

  const explainReminderResult = (result: ReminderResult) => {
    if (result === 'denied') {
      Alert.alert('Notifications are off', 'Allow notifications for Rihla in Settings to turn this on.');
    } else if (result === 'no-times') {
      Alert.alert('Location needed', "Rihla needs your location to work out today's prayer times before it can remind you.");
    }
  };

  useFocusEffect(useCallback(() => {
    getProgressStats().then(setProgressStats);

    Promise.all([
      AsyncStorage.getItem('rihla:lastRead'),
      AsyncStorage.getItem('rihla:goals'),
      AsyncStorage.getItem('rihla:conversations'),
    ])
      .then(([lastReadRaw, goalsRaw, conversationsRaw]) => {
        const lastRead = lastReadRaw ? JSON.parse(lastReadRaw) : null;
        const [juz2Surah, juz2Ayah] = juzStarts[1];
        const finishedJuz1 = !!lastRead && (lastRead.surahId > juz2Surah || (lastRead.surahId === juz2Surah && lastRead.ayah >= juz2Ayah));

        const goals = goalsRaw ? JSON.parse(goalsRaw) : [];
        const goalCompleted = Array.isArray(goals) && goals.some((g: { current: number; target: number }) => g.current >= g.target);

        const conversations = conversationsRaw ? JSON.parse(conversationsRaw) : [];
        const askedSomething = Array.isArray(conversations) && conversations.length > 0;

        setBadgeProgress({ finishedJuz1, goalCompleted, askedSomething });
      })
      .catch(() => {});
  }, []));

  const stats: { label: string; value: string }[] = [
    { label: 'Day streak', value: String(progressStats.streak).padStart(2, '0') },
    { label: 'Level', value: String(progressStats.level).padStart(2, '0') },
    { label: 'Completions', value: String(progressStats.completions) },
  ];

  const allBadges: { icon: IconName; label: string; description: string; earned: boolean }[] = [
    { icon: 'flame-outline', label: '7-day streak', description: 'Stay active 7 days in a row.', earned: progressStats.streak >= 7 },
    { icon: 'book-outline', label: 'First Juz', description: 'Read up to the end of your first Juz.', earned: badgeProgress.finishedJuz1 },
    { icon: 'trophy-outline', label: 'Goal completed', description: 'Finish one of your goals.', earned: badgeProgress.goalCompleted },
    { icon: 'star-outline', label: '30-day streak', description: 'Stay active 30 days in a row.', earned: progressStats.streak >= 30 },
    { icon: 'chatbubble-ellipses-outline', label: 'First question', description: 'Ask something in the Ask tab.', earned: badgeProgress.askedSomething },
    { icon: 'people-outline', label: 'Circle starter', description: 'Add someone to your circle.', earned: circle.length > 0 },
  ];

  const addToCircle = () => {
    const name = circleInput.trim();
    if (!name) return;
    addCircleMember(name);
    setCircleInput('');
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch {
      Alert.alert('Could not sign out', 'Please try again.');
    }
  };

  const confirmSignOut = () => {
    if (Platform.OS === 'web') {
      void handleSignOut();
      return;
    }

    Alert.alert('Sign out?', 'You can always log back in.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => void handleSignOut(),
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.kicker, { color: colors.accent }]}>YOUR ACCOUNT</Text>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setSheet('about')}
          >
            <Ionicons name="settings-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={colors.heroGradient as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { shadowColor: colors.heroShadow }]}
        >
          <Ionicons name="moon-outline" size={80} color="rgba(255,255,255,0.06)" style={styles.heroEmblem} />
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>{avatarInitial}</Text>
          </View>
          <Text style={styles.heroName}>{displayName}</Text>
          <Text style={styles.heroSubtitle}>{memberSince ? `Member since ${memberSince}` : 'Welcome to Rihla'}</Text>
          <View style={styles.statsRow}>
            {stats.map((stat, index) => (
              <View key={stat.label} style={[styles.statItem, index !== 0 && styles.statDivider]}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Badges</Text>
          <TouchableOpacity onPress={() => setSheet('badges')}>
            <Text style={[styles.sectionLink, { color: colors.accent }]}>See all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
          {allBadges.slice(0, 4).map((badge) => (
            <TouchableOpacity
              key={badge.label}
              onPress={() => setSheet('badges')}
              style={[
                styles.badgeCard,
                { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow },
                badge.earned && { borderColor: colors.accent, backgroundColor: colors.accentTint },
                !badge.earned && { opacity: 0.45 },
              ]}
            >
              <Ionicons name={badge.icon} size={22} color={badge.earned ? colors.accent : colors.textTertiary} />
              <Text style={[styles.badgeLabel, { color: colors.textPrimary }]}>{badge.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.themeRow, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}
          onPress={() => setSheet('appearance')}
        >
          <View style={[styles.itemIcon, { backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
            <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={18} color={colors.textSecondary} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.itemLabel, { color: colors.textPrimary }]}>Appearance</Text>
            <Text style={[styles.itemValue, { color: colors.textSecondary }]}>
              {preference === 'system' ? `System (${isDark ? 'Dark' : 'Light'})` : isDark ? 'Dark' : 'Light'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>

        <Text style={[styles.section, { color: colors.textSecondary }]}>Preferences</Text>
        <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
          <TouchableOpacity style={[styles.groupRow, styles.groupRowBorder, { borderBottomColor: colors.border }]} onPress={() => setSheet('notifications')}>
            <View style={[styles.itemIcon, { backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
              <Ionicons name="notifications-outline" size={16} color={colors.textSecondary} />
            </View>
            <Text style={[styles.groupLabel, { color: colors.textPrimary }]}>Notifications</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.groupRow, styles.groupRowBorder, { borderBottomColor: colors.border }]} onPress={() => setSheet('location')}>
            <View style={[styles.itemIcon, { backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            </View>
            <Text style={[styles.groupLabel, { color: colors.textPrimary }]}>Prayer location</Text>
            <Text style={[styles.groupValue, { color: colors.textSecondary }]}>{location}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.groupRow, styles.groupRowBorder, { borderBottomColor: colors.border }]} onPress={() => setSheet('level')}>
            <View style={[styles.itemIcon, { backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
              <Ionicons name="school-outline" size={16} color={colors.textSecondary} />
            </View>
            <Text style={[styles.groupLabel, { color: colors.textPrimary }]}>Experience level</Text>
            <Text style={[styles.groupValue, { color: colors.textSecondary }]} numberOfLines={1}>{levelTitle}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.groupRow} onPress={() => setSheet('language')}>
            <View style={[styles.itemIcon, { backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
              <Ionicons name="language-outline" size={16} color={colors.textSecondary} />
            </View>
            <Text style={[styles.groupLabel, { color: colors.textPrimary }]}>Language</Text>
            <Text style={[styles.groupValue, { color: colors.textSecondary }]}>English</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.section, { color: colors.textSecondary }]}>Account</Text>
        <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
          <TouchableOpacity style={[styles.groupRow, styles.groupRowBorder, { borderBottomColor: colors.border }]} onPress={() => setSheet('circles')}>
            <View style={[styles.itemIcon, { backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
              <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
            </View>
            <Text style={[styles.groupLabel, { color: colors.textPrimary }]}>Connected circles</Text>
            <Text style={[styles.groupValue, { color: colors.textSecondary }]}>{circle.length}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.groupRow, styles.groupRowBorder, { borderBottomColor: colors.border }]} onPress={() => setSheet('privacy')}>
            <View style={[styles.itemIcon, { backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.textSecondary} />
            </View>
            <Text style={[styles.groupLabel, { color: colors.textPrimary }]}>Privacy & data</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.groupRow} onPress={() => setSheet('help')}>
            <View style={[styles.itemIcon, { backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
              <Ionicons name="help-circle-outline" size={16} color={colors.textSecondary} />
            </View>
            <Text style={[styles.groupLabel, { color: colors.textPrimary }]}>Help & support</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.signOut, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}
          onPress={confirmSignOut}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.negative} />
          <Text style={[styles.signOutText, { color: colors.negative }]}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Sheet visible={sheet === 'badges'} onClose={closeSheet} title="Badges">
        {allBadges.map((badge, index) => (
          <View
            key={badge.label}
            style={[styles.badgeRow, index !== allBadges.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
          >
            <View style={[styles.itemIcon, { backgroundColor: badge.earned ? colors.accentTint : colors.iconCircle, borderColor: badge.earned ? colors.accent : colors.iconBorder }]}>
              <Ionicons name={badge.icon} size={17} color={badge.earned ? colors.accent : colors.textTertiary} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.groupLabel, { color: colors.textPrimary, flex: undefined }]}>{badge.label}</Text>
              <Text style={[styles.badgeDescription, { color: colors.textSecondary }]}>{badge.description}</Text>
            </View>
            {badge.earned && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
          </View>
        ))}
      </Sheet>

      <Sheet visible={sheet === 'appearance'} onClose={closeSheet} title="Appearance">
        {appearanceOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={styles.optionRow}
            onPress={() => {
              setPreference(option.key);
              closeSheet();
            }}
          >
            <View style={[styles.itemIcon, { backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
              <Ionicons name={option.icon} size={17} color={colors.textSecondary} />
            </View>
            <Text style={[styles.groupLabel, { color: colors.textPrimary }]}>{option.label}</Text>
            {preference === option.key && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
          </TouchableOpacity>
        ))}
      </Sheet>

      <Sheet visible={sheet === 'notifications'} onClose={closeSheet} title="Notifications">
        <ToggleRow
          label="Prayer reminders"
          subtitle="A reminder, with the adhan, at each prayer time"
          value={allPrayerRemindersOn}
          onValueChange={(v) => setAllPrayers(v).then(explainReminderResult)}
        />
        <ToggleRow
          label="Daily verse"
          subtitle="A morning nudge at 07:30 to read an ayah"
          value={reminderSettings.dailyVerse}
          onValueChange={(v) => setDaily('dailyVerse', v).then(explainReminderResult)}
        />
        <ToggleRow
          label="Streak alerts"
          subtitle="An evening nudge at 20:30 to keep your streak"
          value={reminderSettings.streakAlert}
          onValueChange={(v) => setDaily('streakAlert', v).then(explainReminderResult)}
          last
        />
      </Sheet>

      <Sheet visible={sheet === 'location'} onClose={closeSheet} title="Prayer location">
        <Text style={[styles.sheetIntro, { color: colors.textSecondary }]}>
          Used to calculate accurate prayer times and Qibla direction for where you are.
        </Text>
        <View style={[styles.locationCard, { backgroundColor: colors.iconCircle, borderColor: colors.border }]}>
          <Ionicons name="location" size={18} color={colors.accent} />
          <Text style={[styles.locationText, { color: colors.textPrimary }]}>{location}</Text>
        </View>
        {locationError && <Text style={[styles.errorText, { color: colors.negative }]}>{locationError}</Text>}
        <TouchableOpacity
          style={[styles.sheetPrimary, { backgroundColor: colors.accent }]}
          onPress={detectLocation}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator color={colors.accentOn} />
          ) : (
            <Text style={[styles.sheetPrimaryText, { color: colors.accentOn }]}>Use current location</Text>
          )}
        </TouchableOpacity>
      </Sheet>

      <Sheet visible={sheet === 'language'} onClose={closeSheet} title="Language">
        <TouchableOpacity style={styles.optionRow} onPress={closeSheet}>
          <Text style={[styles.groupLabel, { color: colors.textPrimary }]}>English</Text>
          <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
        </TouchableOpacity>
        <Text style={[styles.footnote, { color: colors.textTertiary }]}>More languages, including Norwegian, are on the way.</Text>
      </Sheet>

      <Sheet visible={sheet === 'level'} onClose={closeSheet} title="Experience level">
        <Text style={[styles.sheetIntro, { color: colors.textSecondary }]}>
          Shapes what Rihla suggests, how Learn is ordered, and how the Guide words its answers.
        </Text>
        {levelOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={styles.optionRow}
            onPress={() => {
              setLevel(option.key);
              closeSheet();
            }}
          >
            <View style={styles.flex}>
              <Text style={[styles.groupLabel, { color: colors.textPrimary, flex: undefined }]}>{option.title}</Text>
              <Text style={[styles.badgeDescription, { color: colors.textSecondary }]}>{option.subtitle}</Text>
            </View>
            {level === option.key && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
          </TouchableOpacity>
        ))}
      </Sheet>

      <Sheet visible={sheet === 'circles'} onClose={closeSheet} title="Connected circles">
        <Text style={[styles.sheetIntro, { color: colors.textSecondary }]}>
          Invite friends or family to see each other&apos;s streaks and cheer each other on.
        </Text>
        <View style={styles.circleInputRow}>
          <TextInput
            value={circleInput}
            onChangeText={setCircleInput}
            placeholder="Name or username"
            placeholderTextColor={colors.textTertiary}
            style={[styles.circleInput, { backgroundColor: colors.iconCircle, borderColor: colors.border, color: colors.textPrimary }]}
            onSubmitEditing={addToCircle}
            returnKeyType="done"
          />
          <TouchableOpacity style={[styles.circleAdd, { backgroundColor: colors.accent }]} onPress={addToCircle}>
            <Ionicons name="add" size={20} color={colors.accentOn} />
          </TouchableOpacity>
        </View>
        {circle.map((name) => (
          <View key={name} style={styles.circleItem}>
            <View style={[styles.circleAvatar, { backgroundColor: colors.accentTint }]}>
              <Text style={[styles.circleAvatarText, { color: colors.accent }]}>{name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={[styles.groupLabel, { color: colors.textPrimary }]}>{name}</Text>
          </View>
        ))}
      </Sheet>

      <Sheet visible={sheet === 'privacy'} onClose={closeSheet} title="Privacy & data">
        <Text style={[styles.sheetIntro, { color: colors.textSecondary }]}>
          Your prayer log, goals, reading history and bookmarks are stored on this device. Rihla does not sell your
          data to third parties, and the app does not collect usage analytics.
        </Text>
      </Sheet>

      <Sheet visible={sheet === 'help'} onClose={closeSheet} title="Help & support">
        <Text style={[styles.sheetIntro, { color: colors.textSecondary }]}>
          Have a question, found a bug, or want to suggest a feature? We read every message.
        </Text>
        <View style={[styles.locationCard, { backgroundColor: colors.iconCircle, borderColor: colors.border }]}>
          <Ionicons name="mail-outline" size={18} color={colors.accent} />
          <Text style={[styles.locationText, { color: colors.textPrimary }]}>support@rihla.app</Text>
        </View>
      </Sheet>

      <Sheet visible={sheet === 'about'} onClose={closeSheet} title="About Rihla">
        <Text style={[styles.sheetIntro, { color: colors.textSecondary }]}>
          Rihla helps you build a consistent, calm daily practice: prayer, Quran and reflection, in one place.
        </Text>
        <View style={styles.aboutRow}>
          <Text style={[styles.groupLabel, { color: colors.textPrimary }]}>Version</Text>
          <Text style={[styles.groupValue, { color: colors.textSecondary }]}>1.0.0</Text>
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

function ToggleRow({
  label,
  subtitle,
  value,
  onValueChange,
  last,
}: {
  label: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.toggleRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={styles.flex}>
        <Text style={[styles.groupLabel, { color: colors.textPrimary, flex: undefined }]}>{label}</Text>
        <Text style={[styles.badgeDescription, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.accent, false: colors.border }} thumbColor="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 18, paddingBottom: 130 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  iconButton: { height: 38, width: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  hero: {
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
    marginTop: 14,
    overflow: 'hidden',
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  heroEmblem: { position: 'absolute', top: -14, right: -10 },
  heroAvatar: {
    height: 62,
    width: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroAvatarText: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  heroName: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginTop: 13 },
  heroSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.68)', marginTop: 3 },
  statsRow: { flexDirection: 'row', marginTop: 22, width: '100%', justifyContent: 'center' },
  statItem: { alignItems: 'center', paddingHorizontal: 20 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.18)' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.62)', marginTop: 4 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 28, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  sectionLink: { fontSize: 11.5, fontWeight: '700' },
  badgeScroll: { marginHorizontal: -18 },
  badgeCard: {
    width: 104,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginLeft: 18,
    alignItems: 'center',
    gap: 9,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  badgeLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginTop: 26,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  itemIcon: { height: 34, width: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  itemLabel: { fontSize: 14, fontWeight: '600' },
  itemValue: { fontSize: 11, marginTop: 3 },
  section: { fontSize: 11, fontWeight: '700', marginTop: 26, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  groupCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  groupRowBorder: { borderBottomWidth: 1 },
  groupLabel: { fontSize: 14, fontWeight: '600', flex: 1 },
  groupValue: { fontSize: 12, marginRight: 4 },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    marginTop: 26,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  signOutText: { fontSize: 14, fontWeight: '700' },

  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  badgeDescription: { fontSize: 12, marginTop: 3 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  sheetIntro: { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  locationCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 14 },
  locationText: { fontSize: 14, fontWeight: '600' },
  errorText: { fontSize: 12, marginTop: 10 },
  sheetPrimary: { height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  sheetPrimaryText: { fontSize: 14, fontWeight: '700' },
  footnote: { fontSize: 11, marginTop: 6 },
  circleInputRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  circleInput: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  circleAdd: { height: 48, width: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  circleItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  circleAvatar: { height: 34, width: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  circleAvatarText: { fontSize: 13, fontWeight: '700' },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
});
