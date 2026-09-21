import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sheet } from '@/components/sheet';
import { usePrayerTimes } from '@/hooks/use-prayer-times';
import { cancelReminder, notificationsSupported, scheduleDailyReminder, sendCelebration } from '@/services/notifications';
import { useTheme } from '@/theme/theme-context';
import type { ThemeColors } from '@/theme/colors';

type IconName = keyof typeof Ionicons.glyphMap;
type Goal = { id: string; name: string; target: number; current: number; remindDaily: boolean };
type ShortcutKey = 'goal' | 'reminders' | 'circles';

const initialGoals: Goal[] = [
  { id: 'g1', name: 'Complete five daily prayers', target: 5, current: 3, remindDaily: false },
  { id: 'g2', name: 'Read Quran', target: 7, current: 2, remindDaily: false },
  { id: 'g3', name: 'Learn a hadith', target: 3, current: 1, remindDaily: false },
];

const shortcuts: { key: ShortcutKey; icon: IconName; title: string; subtitle: string }[] = [
  { key: 'goal', icon: 'flag-outline', title: 'Set a goal', subtitle: 'Build a habit that sticks' },
  { key: 'reminders', icon: 'alarm-outline', title: 'Reminders', subtitle: 'Never miss a prayer' },
  { key: 'circles', icon: 'link-outline', title: 'Connected circles', subtitle: 'Link friends & family' },
];

const watchlist: { icon: IconName; title: string; subtitle: string; value: string; delta: string; up: boolean }[] = [
  { icon: 'time-outline', title: 'Fajr on time', subtitle: 'This week', value: '92%', delta: '+4%', up: true },
  { icon: 'book-outline', title: 'Quran pages', subtitle: 'This week', value: '18', delta: '+6', up: true },
  { icon: 'hand-left-outline', title: 'Dua consistency', subtitle: 'This week', value: '54%', delta: '-3%', up: false },
];

const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

function makeInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `RIHLA-${code}`;
}

export default function ProgressScreen() {
  const { colors } = useTheme();
  const { times: prayerTimesToday } = usePrayerTimes();

  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [activeSheet, setActiveSheet] = useState<ShortcutKey | null>(null);
  const closeSheet = () => setActiveSheet(null);

  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState(3);
  const [goalRemind, setGoalRemind] = useState(false);

  const [reminders, setReminders] = useState<Record<(typeof prayerNames)[number], boolean>>({
    Fajr: false,
    Dhuhr: false,
    Asr: false,
    Maghrib: false,
    Isha: false,
  });
  const [reminderBusy, setReminderBusy] = useState<string | null>(null);

  const [circle, setCircle] = useState<string[]>(['Amina', 'Yusuf']);
  const [circleInput, setCircleInput] = useState('');
  const [myCode] = useState(makeInviteCode);
  const [redeemCode, setRedeemCode] = useState('');
  const [connecting, setConnecting] = useState(false);

  const markGoalDone = (goal: Goal) => {
    if (goal.current >= goal.target) return;
    const nextCurrent = goal.current + 1;
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, current: nextCurrent } : g)));

    if (nextCurrent >= goal.target) {
      Alert.alert('Goal completed', `You finished "${goal.name}" for this week. Nice work.`);
      void sendCelebration('Goal completed', `You finished "${goal.name}" for this week.`);
    }
  };

  const addGoal = async () => {
    const name = goalName.trim();
    if (!name) {
      Alert.alert('Give your goal a name', 'e.g. "Read a page of tafsir daily"');
      return;
    }
    const id = `g${Date.now()}`;
    setGoals((prev) => [{ id, name, target: goalTarget, current: 0, remindDaily: goalRemind }, ...prev]);

    if (goalRemind) {
      const scheduled = await scheduleDailyReminder({
        id: `goal-${id}`,
        title: 'Goal reminder',
        body: `Have you worked on "${name}" today?`,
        hour: 20,
        minute: 0,
      });
      if (!scheduled && notificationsSupported) {
        Alert.alert('Reminder not set', "We couldn't schedule a notification — check notification permissions in Settings.");
      }
    }

    setGoalName('');
    setGoalTarget(3);
    setGoalRemind(false);
    closeSheet();
    Alert.alert('Goal added', `"${name}" is now on your list for this week.`);
  };

  const toggleReminder = async (prayer: (typeof prayerNames)[number], value: boolean) => {
    setReminderBusy(prayer);
    if (value) {
      const time = prayerTimesToday?.timeForPrayer(prayer.toLowerCase() as never);
      const hour = time ? time.getHours() : 5;
      const minute = time ? time.getMinutes() : 0;
      const scheduled = await scheduleDailyReminder({
        id: `prayer-${prayer}`,
        title: `${prayer} reminder`,
        body: time ? `It's almost time for ${prayer}.` : `Time to pray ${prayer}.`,
        hour,
        minute,
      });
      if (scheduled) {
        setReminders((prev) => ({ ...prev, [prayer]: true }));
      } else if (!notificationsSupported) {
        setReminders((prev) => ({ ...prev, [prayer]: true }));
      } else {
        Alert.alert('Notifications are off', 'Allow notifications for Rihla in Settings to get prayer reminders.');
      }
    } else {
      await cancelReminder(`prayer-${prayer}`);
      setReminders((prev) => ({ ...prev, [prayer]: false }));
    }
    setReminderBusy(null);
  };

  const addToCircle = () => {
    const name = circleInput.trim();
    if (!name) return;
    setCircle((prev) => [...prev, name]);
    setCircleInput('');
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(myCode);
    Alert.alert('Copied', 'Your invite code is on your clipboard.');
  };

  const redeemInvite = () => {
    const code = redeemCode.trim().toUpperCase();
    if (!code) return;
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setRedeemCode('');
      const name = `Friend (${code.replace('RIHLA-', '')})`;
      setCircle((prev) => [...prev, name]);
      Alert.alert("You're connected", `${name} has been added to your circle.`);
    }, 700);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.kicker, { color: colors.accent }]}>YOUR JOURNEY</Text>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Progress, made visible.</Text>

        <LinearGradient
          colors={colors.heroGradient as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { shadowColor: colors.heroShadow }]}
        >
          <Ionicons name="moon-outline" size={72} color="rgba(255,255,255,0.07)" style={styles.heroEmblem} />
          <View>
            <Text style={styles.heroLabel}>WEEKLY SCORE</Text>
            <Text style={styles.score}>
              68<Text style={styles.scoreSmall}>%</Text>
            </Text>
            <Text style={styles.heroCaption}>You are building consistency.</Text>
          </View>
          <View style={styles.ring}>
            <Text style={styles.ringText}>+12%</Text>
            <Text style={styles.ringSub}>vs last week</Text>
          </View>
        </LinearGradient>

        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
          <View style={styles.chartHead}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Prayer rhythm</Text>
            <Text style={[styles.tag, { color: colors.accent, backgroundColor: colors.accentTint }]}>7 days</Text>
          </View>
          <View style={styles.graph}>
            {[34, 54, 40, 68, 52, 78, 63].map((v, i) => (
              <View key={i} style={styles.graphBarWrap}>
                <View
                  style={[
                    styles.graphBar,
                    { height: v, backgroundColor: i === 6 ? colors.accent : colors.background, borderColor: i === 6 ? colors.accent : colors.border },
                  ]}
                />
                <Text style={[styles.day, { color: colors.textTertiary }]}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={[styles.section, { color: colors.textPrimary }]}>Shortcuts</Text>
        <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
          {shortcuts.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              onPress={() => setActiveSheet(item.key)}
              style={[styles.shortcutRow, index !== shortcuts.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <View style={[styles.shortcutIcon, { backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
                <Ionicons name={item.icon} size={18} color={colors.textSecondary} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.shortcutTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.shortcutSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeading}>
          <Text style={[styles.section, { color: colors.textPrimary, marginTop: 0 }]}>Watchlist</Text>
          <Text style={[styles.sectionLink, { color: colors.textSecondary }]}>See all</Text>
        </View>
        <View style={[styles.watchlistCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
          {watchlist.map((item, index) => (
            <View
              key={item.title}
              style={[styles.watchRow, index !== watchlist.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <View style={[styles.watchIcon, { backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
                <Ionicons name={item.icon} size={15} color={colors.textSecondary} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.watchTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.watchSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
              </View>
              <View style={styles.watchValueWrap}>
                <Text style={[styles.watchValue, { color: colors.textPrimary }]}>{item.value}</Text>
                <Text style={[styles.watchDelta, { color: item.up ? colors.positive : colors.negative }]}>{item.delta}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeading}>
          <Text style={[styles.section, { color: colors.textPrimary, marginTop: 0 }]}>This week</Text>
          <TouchableOpacity onPress={() => setActiveSheet('goal')}>
            <Text style={[styles.sectionLink, { color: colors.accent }]}>+ Add goal</Text>
          </TouchableOpacity>
        </View>
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} colors={colors} onMarkDone={() => markGoalDone(goal)} />
        ))}
      </ScrollView>

      <Sheet visible={activeSheet === 'goal'} onClose={closeSheet} title="Set a goal">
        <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>GOAL</Text>
        <TextInput
          value={goalName}
          onChangeText={setGoalName}
          placeholder="e.g. Read a page of tafsir daily"
          placeholderTextColor={colors.textTertiary}
          style={[styles.sheetInput, { backgroundColor: colors.iconCircle, borderColor: colors.border, color: colors.textPrimary }]}
        />

        <Text style={[styles.sheetLabel, { color: colors.textSecondary, marginTop: 18 }]}>TIMES PER WEEK</Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity
            onPress={() => setGoalTarget((v) => Math.max(1, v - 1))}
            style={[styles.stepperBtn, { backgroundColor: colors.iconCircle, borderColor: colors.border }]}
          >
            <Ionicons name="remove" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.stepperValue, { color: colors.textPrimary }]}>{goalTarget}</Text>
          <TouchableOpacity
            onPress={() => setGoalTarget((v) => Math.min(7, v + 1))}
            style={[styles.stepperBtn, { backgroundColor: colors.iconCircle, borderColor: colors.border }]}
          >
            <Ionicons name="add" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.remindRow, { borderColor: colors.border }]}>
          <View style={styles.flex}>
            <Text style={[styles.groupLabel, { color: colors.textPrimary }]}>Remind me daily</Text>
            <Text style={[styles.badgeDescription, { color: colors.textSecondary }]}>
              {notificationsSupported ? 'A nudge every evening at 8 PM' : 'Works once you open Rihla on your phone'}
            </Text>
          </View>
          <Switch value={goalRemind} onValueChange={setGoalRemind} trackColor={{ true: colors.accent, false: colors.border }} thumbColor="#FFFFFF" />
        </View>

        <TouchableOpacity style={[styles.sheetPrimary, { backgroundColor: colors.accent }]} onPress={addGoal}>
          <Text style={[styles.sheetPrimaryText, { color: colors.accentOn }]}>Add goal</Text>
        </TouchableOpacity>
      </Sheet>

      <Sheet visible={activeSheet === 'reminders'} onClose={closeSheet} title="Reminders">
        <Text style={[styles.sheetIntro, { color: colors.textSecondary }]}>
          {notificationsSupported
            ? "Get a nudge at each prayer's calculated time, based on your current location."
            : "Notifications aren't available in this preview — these will work once Rihla is running on your phone."}
        </Text>
        {prayerNames.map((prayer, index) => (
          <View
            key={prayer}
            style={[styles.reminderRow, index !== prayerNames.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
          >
            <Text style={[styles.reminderName, { color: colors.textPrimary }]}>{prayer}</Text>
            <Switch
              value={reminders[prayer]}
              disabled={reminderBusy === prayer}
              onValueChange={(value) => toggleReminder(prayer, value)}
              trackColor={{ true: colors.accent, false: colors.border }}
              thumbColor="#FFFFFF"
            />
          </View>
        ))}
      </Sheet>

      <Sheet visible={activeSheet === 'circles'} onClose={closeSheet} title="Connected circles">
        <Text style={[styles.sheetIntro, { color: colors.textSecondary }]}>
          Share your code so a friend can add you, or enter theirs to connect.
        </Text>

        <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>YOUR CODE</Text>
        <View style={[styles.codeCard, { backgroundColor: colors.iconCircle, borderColor: colors.border }]}>
          <Text style={[styles.codeText, { color: colors.textPrimary }]}>{myCode}</Text>
          <TouchableOpacity style={[styles.codeCopy, { backgroundColor: colors.accent }]} onPress={copyCode}>
            <Ionicons name="copy-outline" size={16} color={colors.accentOn} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sheetLabel, { color: colors.textSecondary, marginTop: 18 }]}>ENTER A CODE</Text>
        <View style={styles.circleRow}>
          <TextInput
            value={redeemCode}
            onChangeText={setRedeemCode}
            placeholder="e.g. RIHLA-7XQ2K"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
            style={[styles.circleInput, { backgroundColor: colors.iconCircle, borderColor: colors.border, color: colors.textPrimary }]}
            onSubmitEditing={redeemInvite}
            returnKeyType="done"
          />
          <TouchableOpacity style={[styles.circleAdd, { backgroundColor: colors.accent }]} onPress={redeemInvite} disabled={connecting}>
            <Ionicons name={connecting ? 'ellipsis-horizontal' : 'checkmark'} size={20} color={colors.accentOn} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sheetLabel, { color: colors.textSecondary, marginTop: 18 }]}>CONNECTED ({circle.length})</Text>
        <View style={styles.circleAddByName}>
          <TextInput
            value={circleInput}
            onChangeText={setCircleInput}
            placeholder="Or just add a name"
            placeholderTextColor={colors.textTertiary}
            style={[styles.circleInput, { backgroundColor: colors.iconCircle, borderColor: colors.border, color: colors.textPrimary }]}
            onSubmitEditing={addToCircle}
            returnKeyType="done"
          />
          <TouchableOpacity style={[styles.circleAdd, { backgroundColor: colors.iconCircle, borderWidth: 1, borderColor: colors.border }]} onPress={addToCircle}>
            <Ionicons name="add" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        {circle.map((name) => (
          <View key={name} style={styles.circleItem}>
            <View style={[styles.circleAvatar, { backgroundColor: colors.accentTint }]}>
              <Text style={[styles.circleAvatarText, { color: colors.accent }]}>{name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={[styles.circleName, { color: colors.textPrimary }]}>{name}</Text>
          </View>
        ))}
      </Sheet>
    </SafeAreaView>
  );
}

function GoalCard({ goal, colors, onMarkDone }: { goal: Goal; colors: ThemeColors; onMarkDone: () => void }) {
  const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
  const complete = goal.current >= goal.target;

  return (
    <View style={[styles.goal, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{goal.name}</Text>
          {complete ? (
            <View style={styles.completeTag}>
              <Ionicons name="checkmark-circle" size={13} color={colors.positive} />
              <Text style={[styles.completeTagText, { color: colors.positive }]}>Completed</Text>
            </View>
          ) : goal.remindDaily ? (
            <View style={styles.completeTag}>
              <Ionicons name="alarm-outline" size={12} color={colors.textTertiary} />
              <Text style={[styles.completeTagText, { color: colors.textTertiary }]}>Daily reminder on</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.amount, { color: colors.accent }]}>
          {goal.current} / {goal.target}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: colors.accent }]} />
      </View>
      {!complete && (
        <TouchableOpacity style={[styles.markDone, { borderColor: colors.border }]} onPress={onMarkDone}>
          <Ionicons name="add-circle-outline" size={16} color={colors.accent} />
          <Text style={[styles.markDoneText, { color: colors.accent }]}>Mark today done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 18, paddingBottom: 120 },
  flex: { flex: 1 },
  kicker: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heading: { fontSize: 28, fontWeight: '700', letterSpacing: -0.8, marginTop: 6, marginBottom: 20 },
  hero: {
    borderRadius: 26,
    padding: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  heroEmblem: { position: 'absolute', top: -10, left: -6 },
  heroLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: 'rgba(255,255,255,0.75)' },
  score: { fontSize: 42, fontWeight: '700', color: '#FFFFFF', letterSpacing: -2, marginTop: 10 },
  scoreSmall: { fontSize: 21, color: 'rgba(255,255,255,0.55)' },
  heroCaption: { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginTop: 4 },
  ring: { height: 74, width: 74, borderRadius: 37, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  ringText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  ringSub: { fontSize: 8, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  chartCard: {
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  chartHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  tag: { fontSize: 10, fontWeight: '700', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 },
  graph: { height: 116, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 18 },
  graphBarWrap: { alignItems: 'center', justifyContent: 'flex-end', height: 98 },
  graphBar: { width: 16, borderRadius: 8, borderWidth: 1 },
  day: { fontSize: 10, marginTop: 8 },
  section: { fontSize: 17, fontWeight: '700', marginTop: 28, marginBottom: 11 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 28, marginBottom: 11 },
  sectionLink: { fontSize: 11.5, fontWeight: '700' },
  groupCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  shortcutRow: { paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  shortcutIcon: { height: 38, width: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  shortcutTitle: { fontSize: 14, fontWeight: '600' },
  shortcutSubtitle: { fontSize: 11, marginTop: 3 },
  watchlistCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  watchIcon: { height: 32, width: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  watchTitle: { fontSize: 13, fontWeight: '600' },
  watchSubtitle: { fontSize: 11, marginTop: 3 },
  watchValueWrap: { alignItems: 'flex-end' },
  watchValue: { fontSize: 13, fontWeight: '700' },
  watchDelta: { fontSize: 11, fontWeight: '700', marginTop: 3 },
  goal: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 9,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: 14, fontWeight: '600' },
  amount: { fontSize: 12, fontWeight: '700' },
  track: { height: 5, borderRadius: 9, overflow: 'hidden', marginTop: 14 },
  fill: { height: '100%', borderRadius: 9 },
  completeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  completeTagText: { fontSize: 10.5, fontWeight: '700' },
  markDone: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, borderTopWidth: 1, paddingTop: 12 },
  markDoneText: { fontSize: 12.5, fontWeight: '700' },

  sheetIntro: { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  sheetLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  sheetInput: { height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, marginTop: 8, fontSize: 14 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 10 },
  stepperBtn: { height: 40, width: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontSize: 20, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  remindRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, paddingTop: 16, borderTopWidth: 1 },
  groupLabel: { fontSize: 14, fontWeight: '600' },
  badgeDescription: { fontSize: 11.5, marginTop: 3 },
  sheetPrimary: { height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  sheetPrimaryText: { fontSize: 14, fontWeight: '700' },
  reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  reminderName: { fontSize: 14, fontWeight: '600' },
  codeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 8 },
  codeText: { fontSize: 15, fontWeight: '700', letterSpacing: 1 },
  codeCopy: { height: 34, width: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  circleRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  circleAddByName: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  circleInput: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  circleAdd: { height: 48, width: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  circleItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  circleAvatar: { height: 34, width: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  circleAvatarText: { fontSize: 13, fontWeight: '700' },
  circleName: { fontSize: 14, fontWeight: '600' },
});
