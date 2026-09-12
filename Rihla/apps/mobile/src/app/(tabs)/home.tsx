import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
            <Text style={[styles.avatarText, { color: colors.accent }]}>A</Text>
          </View>
          <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={16} color={colors.textTertiary} />
            <Text style={[styles.searchText, { color: colors.textTertiary }]}>Search Rihla</Text>
          </View>
          <TouchableOpacity style={[styles.headerIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="notifications-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.kicker, { color: colors.accent }]}>WEDNESDAY · 10 SEPTEMBER</Text>
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
            3<Text style={styles.heroSlash}> / 5</Text>
          </Text>
          <Text style={styles.heroCaption}>prayers completed today</Text>
          <View style={styles.prayerDots}>
            {prayerDots.map((prayer, index) => (
              <View key={prayer} style={styles.prayerDotItem}>
                <View style={[styles.dot, index < 3 ? styles.dotDone : index === 3 ? styles.dotNext : styles.dotTodo]} />
                <Text style={styles.dotLabel}>{prayer}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {promoVisible && (
          <View style={[styles.promo, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
            <TouchableOpacity style={styles.promoClose} onPress={() => setPromoVisible(false)}>
              <Ionicons name="close" size={15} color={colors.textTertiary} />
            </TouchableOpacity>
            <View style={[styles.promoIcon, { backgroundColor: colors.accentTint }]}>
              <Ionicons name="sparkles-outline" size={17} color={colors.accent} />
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
            <TouchableOpacity
              key={action.label}
              style={styles.quickItem}
              onPress={action.label === 'Qibla' ? () => router.push('/qibla') : undefined}
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

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>This week</Text>
          <Text style={[styles.sectionLink, { color: colors.textSecondary }]}>Insights</Text>
        </View>
        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
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
          <Text style={[styles.sectionLink, { color: colors.textSecondary }]}>See all</Text>
        </View>
        <TouchableOpacity style={[styles.lesson, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
          <View style={[styles.lessonBadge, { backgroundColor: colors.accentTint, borderColor: colors.accent }]}>
            <Ionicons name="book-outline" size={20} color={colors.accent} />
          </View>
          <View style={styles.lessonText}>
            <Text style={[styles.lessonOverline, { color: colors.textTertiary }]}>FOUNDATIONS · 05 MIN</Text>
            <Text style={[styles.lessonTitle, { color: colors.textPrimary }]}>The meaning of intention</Text>
            <Text style={[styles.lessonSub, { color: colors.textSecondary }]}>Start where every act begins.</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>

        <View style={styles.metrics}>
          <Metric icon="flame-outline" value="07" label="day streak" tint={colors.streakIcon} colors={colors} />
          <Metric icon="sparkles-outline" value="02" label="current level" tint={colors.accent} colors={colors} />
        </View>
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
    <View style={[styles.metric, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
      <Ionicons name={icon} size={17} color={tint} />
      <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
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
  metrics: { flexDirection: 'row', gap: 10, marginTop: 12 },
  metric: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  metricValue: { fontSize: 20, fontWeight: '700', marginTop: 10 },
  metricLabel: { fontSize: 11, marginTop: 2 },
});
