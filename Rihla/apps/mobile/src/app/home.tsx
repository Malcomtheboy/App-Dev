import { View, Text, StyleSheet, ScrollView } from 'react-native';

const weekData = [
  { day: 'M', height: 55 },
  { day: 'T', height: 75 },
  { day: 'O', height: 90 },
  { day: 'T', height: 60 },
  { day: 'F', height: 85 },
  { day: 'L', height: 70 },
  { day: 'S', height: 40 },
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Salaam, Ahmed</Text>
        </View>

        <Text style={styles.label}>Bønner denne uken</Text>
        <Text style={styles.bigNumber}>
          28 <Text style={styles.bigNumberTotal}>/ 35</Text>
        </Text>

        <View style={styles.chart}>
          {weekData.map((item, i) => (
            <View key={i} style={styles.barColumn}>
              <View
                style={[
                  styles.bar,
                  {
                    height: item.height * 0.6,
                    backgroundColor: i === 2 ? '#5DCAA5' : '#1F2521',
                  },
                ]}
              />
              <Text style={styles.barLabel}>{item.day}</Text>
            </View>
          ))}
        </View>

        <View style={styles.prayerCard}>
          <View>
            <Text style={styles.prayerLabel}>Neste bønn</Text>
            <Text style={styles.prayerTime}>Asr · 15:42</Text>
          </View>
          <Text style={styles.moonIcon}>☾</Text>
        </View>

        <View style={styles.streakCard}>
          <View style={styles.streakIconWrapper}>
            <Text style={styles.streakIcon}>🔥</Text>
          </View>
          <View>
            <Text style={styles.streakTitle}>7 dager på rad</Text>
            <Text style={styles.streakSubtitle}>Be Isha for å holde streaken</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <Text style={[styles.navIcon, styles.navIconActive]}>⌂</Text>
        <Text style={styles.navIcon}>📖</Text>
        <View style={styles.navCenterButton}>
          <Text style={styles.navCenterIcon}>💬</Text>
        </View>
        <Text style={styles.navIcon}>📊</Text>
        <Text style={styles.navIcon}>👤</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0C0B' },
  scrollContent: { padding: 20, paddingBottom: 20 },
  header: { marginBottom: 8 },
  greeting: { fontSize: 13, color: '#8B928E' },
  label: { fontSize: 11, color: '#8B928E', marginTop: 12 },
  bigNumber: { fontSize: 34, fontWeight: '600', color: '#fff', marginTop: 2 },
  bigNumberTotal: { fontSize: 14, color: '#5DCAA5', fontWeight: '400' },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 70,
    marginTop: 20,
  },
  barColumn: { flex: 1, alignItems: 'center' },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 9, color: '#5B615D', marginTop: 4 },
  prayerCard: {
    backgroundColor: '#141816',
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prayerLabel: { fontSize: 9, color: '#8B928E' },
  prayerTime: { fontSize: 15, fontWeight: '600', color: '#fff', marginTop: 2 },
  moonIcon: { fontSize: 20, color: '#5DCAA5' },
  streakCard: {
    backgroundColor: '#1F1A0E',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3A2E10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakIcon: { fontSize: 14 },
  streakTitle: { fontSize: 12, fontWeight: '500', color: '#E8B84B' },
  streakSubtitle: { fontSize: 10, color: '#8B928E', marginTop: 1 },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#1A1E1B',
    backgroundColor: '#0A0C0B',
  },
  navIcon: { fontSize: 18, color: '#5B615D' },
  navIconActive: { color: '#5DCAA5' },
  navCenterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5DCAA5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  navCenterIcon: { fontSize: 16 },
});