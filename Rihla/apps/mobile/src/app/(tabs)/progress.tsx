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

const shortcuts: { icon: IconName; title: string; subtitle: string; tint: string }[] = [
  { icon: 'flag-outline', title: 'Set a goal', subtitle: 'Build a habit that sticks', tint: '#4C8DFF' },
  { icon: 'alarm-outline', title: 'Reminders', subtitle: 'Never miss a prayer', tint: '#8B5CF6' },
  { icon: 'link-outline', title: 'Connected circles', subtitle: 'Link friends & family', tint: '#22C3A6' },
];

const watchlist: { icon: IconName; title: string; subtitle: string; value: string; delta: string; up: boolean; tint: string }[] = [
  { icon: 'time-outline', title: 'Fajr on time', subtitle: 'This week', value: '92%', delta: '+4%', up: true, tint: '#4C8DFF' },
  { icon: 'book-outline', title: 'Quran pages', subtitle: 'This week', value: '18', delta: '+6', up: true, tint: '#8B5CF6' },
  { icon: 'hand-left-outline', title: 'Dua consistency', subtitle: 'This week', value: '54%', delta: '-3%', up: false, tint: '#FF9F45' },
];

export default function ProgressScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.kicker, { color: colors.textSecondary }]}>YOUR JOURNEY</Text>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Progress, made visible.</Text>

        <LinearGradient colors={colors.gradientScore as [string, string, string]} style={styles.hero}>
          <View>
            <Text style={styles.heroLabel}>WEEKLY SCORE</Text>
            <Text style={styles.score}>
              68<Text style={styles.scoreSmall}>%</Text>
            </Text>
            <Text style={styles.heroCaption}>You are building consistency.</Text>
          </View>
          <View style={[styles.ring, { borderColor: colors.accent }]}>
            <Text style={styles.ringText}>+12%</Text>
            <Text style={styles.ringSub}>vs last week</Text>
          </View>
        </LinearGradient>

        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.chartHead}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Prayer rhythm</Text>
            <Text style={[styles.tag, { color: colors.accent, backgroundColor: colors.iconCircle }]}>7 days</Text>
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
        {shortcuts.map((item) => (
          <View key={item.title} style={[styles.shortcutRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.shortcutIcon, { backgroundColor: `${item.tint}26` }]}>
              <Ionicons name={item.icon} size={18} color={item.tint} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.shortcutTitle, { color: colors.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.shortcutSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </View>
        ))}

        <View style={styles.sectionHeading}>
          <Text style={[styles.section, { color: colors.textPrimary, marginTop: 0 }]}>Watchlist</Text>
          <Text style={[styles.sectionLink, { color: colors.accent }]}>See all</Text>
        </View>
        <View style={[styles.watchlistCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {watchlist.map((item, index) => (
            <View
              key={item.title}
              style={[styles.watchRow, index !== watchlist.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <View style={[styles.watchIcon, { backgroundColor: `${item.tint}26` }]}>
                <Ionicons name={item.icon} size={16} color={item.tint} />
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
    <View style={[styles.goal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
  kicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heading: { fontSize: 29, fontWeight: '700', letterSpacing: -1, marginTop: 7, marginBottom: 21 },
  hero: { borderRadius: 24, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: '#B9C3E8' },
  score: { fontSize: 44, fontWeight: '700', color: '#FFFFFF', letterSpacing: -2, marginTop: 10 },
  scoreSmall: { fontSize: 23, color: '#B9C3E8' },
  heroCaption: { fontSize: 12, color: '#C7CEE8', marginTop: 3 },
  ring: { height: 79, width: 79, borderRadius: 40, borderWidth: 7, alignItems: 'center', justifyContent: 'center' },
  ringText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  ringSub: { fontSize: 8, color: '#BAC3DF', marginTop: 2 },
  chartCard: { marginTop: 12, borderRadius: 22, borderWidth: 1, padding: 18 },
  chartHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  tag: { fontSize: 10, fontWeight: '800', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 },
  graph: { height: 116, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 18 },
  graphBarWrap: { alignItems: 'center', justifyContent: 'flex-end', height: 98 },
  graphBar: { width: 18, borderRadius: 9, borderWidth: 1 },
  day: { fontSize: 10, marginTop: 8 },
  section: { fontSize: 18, fontWeight: '700', marginTop: 29, marginBottom: 11 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 29, marginBottom: 11 },
  sectionLink: { fontSize: 12, fontWeight: '800' },
  shortcutRow: { borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  shortcutIcon: { height: 38, width: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  shortcutTitle: { fontSize: 14, fontWeight: '600' },
  shortcutSubtitle: { fontSize: 11, marginTop: 3 },
  watchlistCard: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14 },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  watchIcon: { height: 34, width: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  watchTitle: { fontSize: 13, fontWeight: '600' },
  watchSubtitle: { fontSize: 11, marginTop: 3 },
  watchValueWrap: { alignItems: 'flex-end' },
  watchValue: { fontSize: 13, fontWeight: '700' },
  watchDelta: { fontSize: 11, fontWeight: '700', marginTop: 3 },
  goal: { borderWidth: 1, borderRadius: 19, padding: 16, marginBottom: 9 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 14, fontWeight: '600' },
  amount: { fontSize: 12, fontWeight: '800' },
  track: { height: 6, borderRadius: 9, overflow: 'hidden', marginTop: 14 },
  fill: { height: '100%', borderRadius: 9 },
});
