import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/theme-context';

type IconName = keyof typeof Ionicons.glyphMap;

const stats: { label: string; value: string }[] = [
  { label: 'Day streak', value: '07' },
  { label: 'Level', value: '02' },
  { label: 'Points', value: '1.2k' },
];

const badges: { icon: IconName; label: string; earned: boolean }[] = [
  { icon: 'flame-outline', label: '7-day streak', earned: true },
  { icon: 'book-outline', label: 'First Juz', earned: true },
  { icon: 'moon-outline', label: 'Night prayer', earned: true },
  { icon: 'star-outline', label: '30-day streak', earned: false },
];

const settingsGroups: { title: string; items: { icon: IconName; label: string; value?: string }[] }[] = [
  {
    title: 'Preferences',
    items: [
      { icon: 'notifications-outline', label: 'Notifications' },
      { icon: 'location-outline', label: 'Prayer location', value: 'Oslo, NO' },
      { icon: 'language-outline', label: 'Language', value: 'English' },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: 'people-outline', label: 'Connected circles' },
      { icon: 'shield-checkmark-outline', label: 'Privacy & data' },
      { icon: 'help-circle-outline', label: 'Help & support' },
    ],
  },
];

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.kicker, { color: colors.accent }]}>YOUR ACCOUNT</Text>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
            <Text style={styles.heroAvatarText}>A</Text>
          </View>
          <Text style={styles.heroName}>Ahmad</Text>
          <Text style={styles.heroSubtitle}>Member since Jan 2025</Text>
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
          <Text style={[styles.sectionLink, { color: colors.textSecondary }]}>See all</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
          {badges.map((badge) => (
            <View
              key={badge.label}
              style={[
                styles.badgeCard,
                { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow },
                badge.earned && { borderColor: colors.accent, backgroundColor: colors.accentTint },
                !badge.earned && { opacity: 0.45 },
              ]}
            >
              <Ionicons name={badge.icon} size={22} color={badge.earned ? colors.accent : colors.textTertiary} />
              <Text style={[styles.badgeLabel, { color: colors.textPrimary }]}>{badge.label}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.themeRow, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
          <View style={[styles.itemIcon, { backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
            <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={18} color={colors.textSecondary} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.itemLabel, { color: colors.textPrimary }]}>Appearance</Text>
            <Text style={[styles.itemValue, { color: colors.textSecondary }]}>
              System ({isDark ? 'Dark' : 'Light'})
            </Text>
          </View>
        </View>

        {settingsGroups.map((group) => (
          <View key={group.title}>
            <Text style={[styles.section, { color: colors.textSecondary }]}>{group.title}</Text>
            <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
              {group.items.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.groupRow, index !== group.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                >
                  <View style={[styles.itemIcon, { backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
                    <Ionicons name={item.icon} size={16} color={colors.textSecondary} />
                  </View>
                  <Text style={[styles.groupLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                  {item.value && <Text style={[styles.groupValue, { color: colors.textSecondary }]}>{item.value}</Text>}
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={[styles.signOut, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
          <Ionicons name="log-out-outline" size={18} color={colors.negative} />
          <Text style={[styles.signOutText, { color: colors.negative }]}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  sectionLink: { fontSize: 11.5, fontWeight: '600' },
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
});
