import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/theme-context';
import type { ThemeColors } from '@/theme/colors';

const prayerDots = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const chartHeights = [20, 35, 29, 48, 39, 57, 50];

type IconName = keyof typeof Ionicons.glyphMap;

export default function HomeScreen() {
  const { colors } = useTheme();
  const [promoVisible, setPromoVisible] = useState(true);

  const actions: { icon: IconName; label: string; tint: string }[] = [
    { icon: 'time-outline', label: 'Prayer\ntimes', tint: colors.blue },
    { icon: 'book-outline', label: 'Quran', tint: colors.purple },
    { icon: 'hand-left-outline', label: 'Dua', tint: colors.teal },
    { icon: 'compass-outline', label: 'Qibla', tint: colors.orange },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <LinearGradient colors={[colors.purple, colors.blue]} style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </LinearGradient>
          <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <Text style={[styles.searchText, { color: colors.textSecondary }]}>Search Rihla</Text>
          </View>
          <TouchableOpacity style={[styles.headerIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="notifications-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.kicker, { color: colors.textSecondary }]}>WEDNESDAY · 10 SEPTEMBER</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Your day, in balance.</Text>

        <LinearGradient
          colors={colors.gradientHero as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>PRAYER MOMENTUM</Text>
            <View style={styles.liveChip}>
              <View style={[styles.liveDot, { backgroundColor: colors.accent }]} />
              <Text style={styles.liveChipText}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.heroNumber}>
            3<Text style={styles.heroSlash}> / 5</Text>
          </Text>
          <Text style={styles.heroCaption}>prayers completed today</Text>
          <View style={styles.prayerDots}>
            {prayerDots.map((prayer, index) => (
              <View key={prayer} style={styles.prayerDotItem}>
                <View
                  style={[
                    styles.dot,
                    index < 3 ? { backgroundColor: colors.accent } : index === 3 ? styles.dotNext : styles.dotTodo,
                  ]}
                >
                  {index < 3 && <Ionicons name="checkmark" color={colors.accentOn} size={11} />}
                </View>
                <Text style={styles.dotLabel}>{prayer}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {promoVisible && (
          <View style={[styles.promo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.promoClose} onPress={() => setPromoVisible(false)}>
              <Ionicons name="close" size={15} color={colors.textTertiary} />
            </TouchableOpacity>
            <View style={[styles.promoIcon, { backgroundColor: colors.iconCircle }]}>
              <Ionicons name="sparkles" size={18} color={colors.accent} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.promoTitle, { color: colors.textPrimary }]}>Your Quran streak, protected</Text>
              <Text style={[styles.promoText, { color: colors.textSecondary }]} numberOfLines={1}>
                Set a daily reminder so you never miss a page.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.quickRow}>
          {actions.map((action) => (
            <TouchableOpacity key={action.label} style={styles.quickItem}>
              <View style={[styles.quickIcon, { backgroundColor: `${action.tint}26` }]}>
                <Ionicons name={action.icon} size={20} color={action.tint} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>This week</Text>
          <Text style={[styles.sectionLink, { color: colors.accent }]}>Insights</Text>
        </View>
        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View>
            <Text style={[styles.chartValue, { color: colors.textPrimary }]}>82%</Text>
            <Text style={[styles.chartCaption, { color: colors.textSecondary }]}>Prayer consistency</Text>
            <View style={styles.chartDelta}>
              <Ionicons name="trending-up" size={12} color={colors.positive} />
              <Text style={[styles.chartDeltaText, { color: colors.positive }]}>+6% vs last week</Text>
            </View>
          </View>
          <View style={styles.chart}>
            {chartHeights.map((height, i) => (
              <View key={i} style={[styles.bar, { height, backgroundColor: i === 6 ? colors.accent : colors.border }]} />
            ))}
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Continue</Text>
          <Text style={[styles.sectionLink, { color: colors.accent }]}>See all</Text>
        </View>
        <TouchableOpacity style={[styles.lesson, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <LinearGradient colors={[colors.purple, colors.blue]} style={styles.lessonBadge}>
            <Ionicons name="book-outline" size={20} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.lessonText}>
            <Text style={[styles.lessonOverline, { color: colors.textSecondary }]}>FOUNDATIONS · 05 MIN</Text>
            <Text style={[styles.lessonTitle, { color: colors.textPrimary }]}>The meaning of intention</Text>
            <Text style={[styles.lessonSub, { color: colors.textSecondary }]}>Start where every act begins.</Text>
          </View>
          <View style={[styles.lessonArrow, { backgroundColor: colors.iconCircle }]}>
            <Ionicons name="arrow-forward" size={16} color={colors.textPrimary} />
          </View>
        </TouchableOpacity>

        <View style={styles.metrics}>
          <Metric icon="flame" value="07" label="day streak" tint={colors.streakIcon} colors={colors} />
          <Metric icon="sparkles" value="02" label="current level" tint={colors.accent} colors={colors} />
        </View>

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Explore</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exploreScroll}>
          <ExploreCard icon="moon-outline" title="Night prayer" subtitle="Qiyam al-layl" tint={colors.purple} colors={colors} />
          <ExploreCard icon="people-outline" title="Community" subtitle="Local circles" tint={colors.teal} colors={colors} />
          <ExploreCard icon="heart-outline" title="Charity" subtitle="Give sadaqah" tint={colors.pink} colors={colors} />
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({
  icon,
  value,
  label,
  tint,
  colors,
}: {
  icon: IconName;
  value: string;
  label: string;
  tint: string;
  colors: ThemeColors;
}) {
  return (
    <View style={[styles.metric, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.metricIcon, { backgroundColor: `${tint}26` }]}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
      <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function ExploreCard({
  icon,
  title,
  subtitle,
  tint,
  colors,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  tint: string;
  colors: ThemeColors;
}) {
  return (
    <TouchableOpacity style={[styles.exploreCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.exploreIcon, { backgroundColor: `${tint}26` }]}>
        <Ionicons name={icon} size={19} color={tint} />
      </View>
      <Text style={[styles.exploreTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.exploreSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 18, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
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
  headerIcon: { height: 38, width: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  kicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 27 },
  title: { fontSize: 29, fontWeight: '700', letterSpacing: -1, marginTop: 7, marginBottom: 19 },
  hero: { borderRadius: 25, padding: 19, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: '#D7D4FF' },
  liveChip: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  liveDot: { height: 5, width: 5, borderRadius: 3 },
  liveChipText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  heroNumber: { fontSize: 46, fontWeight: '700', letterSpacing: -2, color: '#FFFFFF', marginTop: 21 },
  heroSlash: { fontSize: 23, fontWeight: '600', color: '#AEAECC' },
  heroCaption: { fontSize: 13, color: '#D4D8EE', marginTop: 0 },
  prayerDots: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  prayerDotItem: { alignItems: 'center' },
  dot: { height: 24, width: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dotNext: { backgroundColor: '#FFFFFF', borderWidth: 5, borderColor: '#B5ABFF' },
  dotTodo: { backgroundColor: 'rgba(255,255,255,0.20)' },
  dotLabel: { color: '#D5D8EC', fontSize: 9, marginTop: 6 },
  promo: {
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  promoClose: { position: 'absolute', top: 10, right: 10, padding: 2 },
  promoIcon: { height: 38, width: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  promoTitle: { fontSize: 13, fontWeight: '700' },
  promoText: { fontSize: 11, marginTop: 3 },
  flex: { flex: 1 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  quickItem: { alignItems: 'center', gap: 7, width: 68 },
  quickIcon: { height: 52, width: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center', lineHeight: 13 },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 11,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  sectionLink: { fontSize: 12, fontWeight: '800' },
  chartCard: {
    height: 128,
    borderRadius: 20,
    borderWidth: 1,
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  chartValue: { fontSize: 28, fontWeight: '700', letterSpacing: -1 },
  chartCaption: { fontSize: 12, marginTop: 3 },
  chartDelta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 9 },
  chartDeltaText: { fontSize: 11, fontWeight: '700' },
  chart: { height: 70, flexDirection: 'row', gap: 5, alignItems: 'flex-end' },
  bar: { width: 8, borderRadius: 8 },
  lesson: { borderRadius: 21, borderWidth: 1, minHeight: 97, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 13 },
  lessonBadge: { height: 47, width: 47, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  lessonText: { flex: 1 },
  lessonOverline: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  lessonTitle: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  lessonSub: { fontSize: 12, marginTop: 4 },
  lessonArrow: { height: 32, width: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  metrics: { flexDirection: 'row', gap: 10, marginTop: 11 },
  metric: { flex: 1, borderWidth: 1, borderRadius: 19, padding: 15 },
  metricIcon: { height: 30, width: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontSize: 21, fontWeight: '700', marginTop: 10 },
  metricLabel: { fontSize: 11, marginTop: 2 },
  exploreScroll: { marginHorizontal: -18 },
  exploreCard: { width: 138, borderRadius: 20, borderWidth: 1, padding: 15, marginLeft: 18, gap: 10 },
  exploreIcon: { height: 38, width: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  exploreTitle: { fontSize: 13, fontWeight: '700' },
  exploreSubtitle: { fontSize: 11 },
});
