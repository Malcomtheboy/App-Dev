import { Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme-context';

export default function HomeScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Ionicons
            name={isDark ? 'sunny-outline' : 'moon-outline'}
            size={14}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <Text style={styles.greeting}>Assalamu alaikum, Ahmed</Text>
        <Text style={styles.subGreeting}>May Allah make it easy for you</Text>

        <TouchableOpacity style={styles.heroCard} activeOpacity={0.85}>
          <Ionicons
            name="notifications-outline"
            size={13}
            color={colors.accent}
            style={styles.bellIcon}
          />
          <Text style={styles.heroLabel}>NEXT PRAYER</Text>
          <Text style={styles.heroPrayer}>Asr</Text>
          <Text style={styles.heroDetail}>4:48 PM · Horten, Norway</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.progressSection} activeOpacity={0.7}>
          <Text style={styles.progressLabel}>Today's progress</Text>
          <Text style={styles.progressCount}>3/5</Text>
          <Ionicons name="chevron-forward" size={12} color={colors.textTertiary} />
        </TouchableOpacity>
        <ProgressBar colors={colors} percent={60} />

        <TouchableOpacity style={styles.statsRow} activeOpacity={0.7}>
          <TouchableOpacity style={styles.statCard} activeOpacity={0.7}>
            <Ionicons name="flame-outline" size={16} color={colors.streakIcon} />
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={styles.statValue}>12 days</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} activeOpacity={0.7}>
            <Ionicons name="book-outline" size={16} color={colors.accent} />
            <Text style={styles.statLabel}>Level</Text>
            <Text style={styles.statValue}>Level 2</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Today's learning</Text>
        <TouchableOpacity style={styles.learningCard} activeOpacity={0.7}>
          <Ionicons name="bulb-outline" size={16} color={colors.accent} style={styles.learningIconWrapper} />
          <Text style={styles.learningTitle}>Introduction to Salah</Text>
          <Text style={styles.learningSubtitle}>Level 1 · 5 min</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProgressBar({ colors, percent }: { colors: ReturnType<typeof useTheme>['colors']; percent: number }) {
  return (
    <TouchableOpacity
      activeOpacity={1}
      style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, marginBottom: 14 }}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={{ width: `${percent}%`, height: '100%', backgroundColor: colors.accent, borderRadius: 3 }}
      />
    </TouchableOpacity>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: 20, paddingBottom: 20 },
    themeToggle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.iconCircle,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-end',
    },
    greeting: { fontSize: 13, fontWeight: '500', color: colors.textPrimary, marginTop: -18 },
    subGreeting: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
    heroCard: {
      backgroundColor: colors.heroBg,
      borderRadius: 16,
      padding: 14,
      marginTop: 14,
    },
    bellIcon: { alignSelf: 'flex-end' },
    heroLabel: { fontSize: 10, color: colors.accent, fontWeight: '500', marginTop: -22 },
    heroPrayer: { fontSize: 24, fontWeight: '600', color: colors.textPrimary, marginTop: 6 },
    heroDetail: { fontSize: 11, color: colors.accentSubtle, marginTop: 2 },
    progressSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
      marginBottom: 6,
      gap: 6,
    },
    progressLabel: { fontSize: 11, color: colors.textSecondary, flex: 1 },
    progressCount: { fontSize: 11, fontWeight: '500', color: colors.textPrimary },
    statsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 12,
    },
    statLabel: { fontSize: 9, color: colors.textSecondary, marginTop: 8 },
    statValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginTop: 1 },
    sectionLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 16, marginBottom: 8 },
    learningCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    learningIconWrapper: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.heroBg,
      textAlign: 'center',
      textAlignVertical: 'center',
      overflow: 'hidden',
    },
    learningTitle: { fontSize: 12, fontWeight: '500', color: colors.textPrimary, flex: 1 },
    learningSubtitle: { display: 'none' },
  });
}