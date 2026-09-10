import { Text, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/theme-context';

const settingsItems = ['Settings', 'Notifications', 'Log out'];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>A</Text>
      </View>
      <Text style={styles.name}>Ahmed Hassan</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Level 3 · Deepening</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>28</Text>
          <Text style={styles.statLabel}>Prayers</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>6</Text>
          <Text style={styles.statLabel}>Modules</Text>
        </View>
      </View>

      {settingsItems.map((item) => (
        <View key={item} style={styles.row}>
          <Text style={styles.rowText}>{item}</Text>
        </View>
      ))}
    </SafeAreaView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 20, alignItems: 'center' },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.heroBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    avatarText: { fontSize: 18, fontWeight: '500', color: colors.accent },
    name: { fontSize: 14, fontWeight: '500', color: colors.textPrimary, marginTop: 10 },
    badge: {
      backgroundColor: colors.heroBg,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 3,
      marginTop: 6,
    },
    badgeText: { fontSize: 9, color: colors.accent },
    statsRow: { flexDirection: 'row', gap: 8, marginTop: 20, width: '100%' },
    statBox: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 10,
      alignItems: 'center',
    },
    statNumber: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
    statLabel: { fontSize: 8, color: colors.textSecondary, marginTop: 2 },
    row: {
      width: '100%',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowText: { fontSize: 12, color: colors.textPrimary },
  });
}