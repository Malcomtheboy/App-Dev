import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/theme-context';

type IconName = keyof typeof Ionicons.glyphMap;

const stats: { label: string; value: string }[] = [
  { label: 'Day streak', value: '07' },
  { label: 'Level', value: '02' },
  { label: 'Points', value: '1.2k' },
];

const badges: { icon: IconName; label: string; tint: string; earned: boolean }[] = [
  { icon: 'flame', label: '7-day streak', tint: '#F5B84E', earned: true },
  { icon: 'book', label: 'First Juz', tint: '#8B5CF6', earned: true },
  { icon: 'moon', label: 'Night prayer', tint: '#4C8DFF', earned: true },
  { icon: 'star', label: '30-day streak', tint: '#22C3A6', earned: false },
];

const settingsGroups: { title: string; items: { icon: IconName; label: string; tint: string; value?: string }[] }[] = [
  {
    title: 'Preferences',
    items: [
      { icon: 'notifications-outline', label: 'Notifications', tint: '#4C8DFF' },
      { icon: 'location-outline', label: 'Prayer location', tint: '#22C3A6', value: 'Oslo, NO' },
      { icon: 'language-outline', label: 'Language', tint: '#FF9F45', value: 'English' },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: 'people-outline', label: 'Connected circles', tint: '#8B5CF6' },
      { icon: 'shield-checkmark-outline', label: 'Privacy & data', tint: '#FF6FA5' },
      { icon: 'help-circle-outline', label: 'Help & support', tint: '#F5B84E' },
    ],
  },
];

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.kicker, { color: colors.textSecondary }]}>YOUR ACCOUNT</Text>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="settings-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <LinearGradient colors={colors.gradientHero as [string, string, string]} style={styles.hero}>
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
          <Text style={[styles.sectionLink, { color: colors.accent }]}>See all</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
          {badges.map((badge) => (
            <View key={badge.label} style={[styles.badgeCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: badge.earned ? 1 : 0.4 }]}>
              <View style={[styles.badgeIcon, { backgroundColor: `${badge.tint}26` }]}>
                <Ionicons name={badge.icon} size={22} color={badge.tint} />
              </View>
              <Text style={[styles.badgeLabel, { color: colors.textPrimary }]}>{badge.label}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.themeRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.itemIcon, { backgroundColor: colors.iconCircle }]}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.accent} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.itemLabel, { color: colors.textPrimary }]}>Dark mode</Text>
            <Text style={[styles.itemValue, { color: colors.textSecondary }]}>{isDark ? 'On' : 'Off'}</Text>
          </View>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: colors.accent, false: colors.border }} thumbColor="#FFFFFF" />
        </View>

        {settingsGroups.map((group) => (
          <View key={group.title}>
            <Text style={[styles.section, { color: colors.textPrimary }]}>{group.title}</Text>
            <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {group.items.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.groupRow, index !== group.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                >
                  <View style={[styles.itemIcon, { backgroundColor: `${item.tint}26` }]}>
                    <Ionicons name={item.icon} size={17} color={item.tint} />
                  </View>
                  <Text style={[styles.groupLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                  {item.value && <Text style={[styles.groupValue, { color: colors.textSecondary }]}>{item.value}</Text>}
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={[styles.signOut, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
  kicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  iconButton: { height: 38, width: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  hero: { borderRadius: 26, padding: 22, alignItems: 'center', marginTop: 14 },
  heroAvatar: {
    height: 64,
    width: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroAvatarText: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  heroName: { fontSize: 21, fontWeight: '700', color: '#FFFFFF', marginTop: 13 },
  heroSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  statsRow: { flexDirection: 'row', marginTop: 22, width: '100%', justifyContent: 'center' },
  statItem: { alignItems: 'center', paddingHorizontal: 20 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.18)' },
  statValue: { fontSize: 19, fontWeight: '700', color: '#FFFFFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  sectionLink: { fontSize: 12, fontWeight: '800' },
  badgeScroll: { marginHorizontal: -18 },
  badgeCard: { width: 108, borderRadius: 18, borderWidth: 1, padding: 14, marginLeft: 18, alignItems: 'center', gap: 9 },
  badgeIcon: { height: 42, width: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  badgeLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 18, padding: 14, marginTop: 26 },
  itemIcon: { height: 36, width: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { fontSize: 14, fontWeight: '600' },
  itemValue: { fontSize: 11, marginTop: 3 },
  section: { fontSize: 15, fontWeight: '700', marginTop: 24, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.85 },
  groupCard: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14 },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  groupLabel: { fontSize: 14, fontWeight: '600', flex: 1 },
  groupValue: { fontSize: 12, marginRight: 4 },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 18, padding: 15, marginTop: 26 },
  signOutText: { fontSize: 14, fontWeight: '700' },
});
