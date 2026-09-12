import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/theme-context';
import type { ThemeColors } from '@/theme/colors';

type IconName = keyof typeof Ionicons.glyphMap;

const goals: [string, string, number][] = [
  ['Complete five daily prayers', '3 / 5', 60],
  ['Read Quran', '2 / 7 days', 29],
  ['Learn a hadith', '1 / 3', 33],
];

const shortcuts: { icon: IconName; title: string; subtitle: string }[] = [
  { icon: 'flag-outline', title: 'Set a goal', subtitle: 'Build a habit that sticks' },
  { icon: 'alarm-outline', title: 'Reminders', subtitle: 'Never miss a prayer' },
  { icon: 'link-outline', title: 'Connected circles', subtitle: 'Link friends & family' },
];

const watchlist: { icon: IconName; title: string; subtitle: string; value: string; delta: string; up: boolean }[] = [
  { icon: 'time-outline', title: 'Fajr on time', subtitle: 'This week', value: '92%', delta: '+4%', up: true },
  { icon: 'book-outline', title: 'Quran pages', subtitle: 'This week', value: '18', delta: '+6', up: true },
  { icon: 'hand-left-outline', title: 'Dua consistency', subtitle: 'This week', value: '54%', delta: '-3%', up: false },
];

export default function ProgressScreen() {
  const { colors } = useTheme();

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
            <View
              key={item.title}
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
            </View>
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

        <Text style={[styles.section, { color: colors.textPrimary }]}>This week</Text>
        {goals.map(([name, amount, percent]) => (
          <Goal key={name} name={name} amount={amount} percent={percent} colors={colors} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Goal({ name, amount, percent, colors }: { name: string; amount: string; percent: number; colors: ThemeColors }) {
  return (
    <View style={[styles.goal, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
      <View style={styles.row}>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{name}</Text>
        <Text style={[styles.amount, { color: colors.accent }]}>{amount}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: colors.accent }]} />
      </View>
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
  sectionLink: { fontSize: 11.5, fontWeight: '600' },
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
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 14, fontWeight: '600' },
  amount: { fontSize: 12, fontWeight: '700' },
  track: { height: 5, borderRadius: 9, overflow: 'hidden', marginTop: 14 },
  fill: { height: '100%', borderRadius: 9 },
});
