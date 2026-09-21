import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Prayer } from 'adhan';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Sheet } from '@/components/sheet';
import { calculationMethods, usePrayerTimes } from '@/hooks/use-prayer-times';
import { useTheme } from '@/theme/theme-context';

type IconName = keyof typeof Ionicons.glyphMap;
type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'none';

const prayerMeta: { key: Exclude<PrayerName, 'none'>; label: string; icon: IconName }[] = [
  { key: Prayer.Fajr, label: 'Fajr', icon: 'moon-outline' },
  { key: Prayer.Sunrise, label: 'Sunrise', icon: 'partly-sunny-outline' },
  { key: Prayer.Dhuhr, label: 'Dhuhr', icon: 'sunny-outline' },
  { key: Prayer.Asr, label: 'Asr', icon: 'sunny' },
  { key: Prayer.Maghrib, label: 'Maghrib', icon: 'cloudy-night-outline' },
  { key: Prayer.Isha, label: 'Isha', icon: 'moon' },
];

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatCountdown(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export default function PrayerTimesScreen() {
  const { colors } = useTheme();
  const { place, loading, message, retry, now, method, setMethod, times } = usePrayerTimes();
  const [pickerOpen, setPickerOpen] = useState(false);

  const nextPrayer = times?.nextPrayer() ?? Prayer.None;
  const currentPrayer = times?.currentPrayer() ?? Prayer.None;
  const nextTime = times && nextPrayer !== Prayer.None ? times.timeForPrayer(nextPrayer) : null;
  const countdown = nextTime ? formatCountdown(nextTime.getTime() - now.getTime()) : null;
  const nextLabel = prayerMeta.find((p) => p.key === nextPrayer)?.label ?? (nextPrayer === Prayer.None ? "Tomorrow's Fajr" : '');
  const methodLabel = calculationMethods.find((m) => m.key === method)?.label ?? '';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="chevron-back" size={21} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Prayer times</Text>
            <Text style={[styles.brand, { color: colors.textTertiary }]}>
              {place ?? (loading ? 'Locating…' : 'RIHLA')}
            </Text>
          </View>
          <View style={[styles.logoMark, { backgroundColor: colors.accentTint, borderColor: colors.accent }]}>
            <Ionicons name="moon-outline" size={17} color={colors.accent} />
          </View>
        </View>

        {times && nextPrayer !== undefined && (
          <LinearGradient
            colors={colors.heroGradient as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { shadowColor: colors.heroShadow }]}
          >
            <Ionicons name="moon-outline" size={72} color="rgba(255,255,255,0.07)" style={styles.heroEmblem} />
            <Text style={styles.heroLabel}>{countdown ? `NEXT PRAYER · IN ${countdown.toUpperCase()}` : 'NEXT PRAYER'}</Text>
            <Text style={styles.heroPrayer}>{nextLabel}</Text>
            {nextTime && <Text style={styles.heroTime}>{formatTime(nextTime)}</Text>}
          </LinearGradient>
        )}

        {loading && !times && (
          <View style={[styles.loadingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ActivityIndicator color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Finding your prayer times…</Text>
          </View>
        )}

        {times && (
          <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
            {prayerMeta.map((prayer, index) => {
              const time = times.timeForPrayer(prayer.key);
              if (!time) return null;
              const isNext = prayer.key === nextPrayer;
              const isNow = prayer.key === currentPrayer;
              return (
                <View
                  key={prayer.label}
                  style={[
                    styles.prayerRow,
                    index !== prayerMeta.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    isNext && { backgroundColor: colors.accentTint, marginHorizontal: -14, paddingHorizontal: 14, borderRadius: 14 },
                  ]}
                >
                  <View style={[styles.prayerIcon, { backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
                    <Ionicons name={prayer.icon} size={17} color={isNext ? colors.accent : colors.textSecondary} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.prayerName, { color: colors.textPrimary }]}>{prayer.label}</Text>
                    {isNow && <Text style={[styles.prayerTag, { color: colors.accent }]}>Current</Text>}
                    {isNext && <Text style={[styles.prayerTag, { color: colors.accent }]}>Next</Text>}
                  </View>
                  <Text style={[styles.prayerTime, { color: colors.textPrimary }]}>{formatTime(time)}</Text>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={[styles.methodRow, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}
          onPress={() => setPickerOpen(true)}
        >
          <View style={[styles.prayerIcon, { backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
            <Ionicons name="options-outline" size={17} color={colors.textSecondary} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.prayerName, { color: colors.textPrimary }]}>Calculation method</Text>
            <Text style={[styles.methodValue, { color: colors.textSecondary }]}>{methodLabel}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>

        {message && (
          <>
            <View style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="location-outline" size={22} color={colors.streakIcon} />
              <View style={styles.flex}>
                <Text style={[styles.noticeTitle, { color: colors.textPrimary }]}>Location permission needed</Text>
                <Text style={[styles.noticeText, { color: colors.textSecondary }]}>{message}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={retry}
              style={[styles.retry, { backgroundColor: colors.accent }]}
            >
              <Text style={[styles.retryText, { color: colors.accentOn }]}>Try again</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Sheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title="Calculation method">
        {calculationMethods.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={styles.methodOption}
            onPress={() => {
              setMethod(m.key);
              setPickerOpen(false);
            }}
          >
            <Text style={[styles.methodOptionText, { color: colors.textPrimary }]}>{m.label}</Text>
            {m.key === method && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
          </TouchableOpacity>
        ))}
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 460, alignSelf: 'center', padding: 18, paddingBottom: 116 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  logoMark: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  brand: { fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  hero: {
    borderRadius: 26,
    padding: 24,
    marginTop: 22,
    overflow: 'hidden',
    alignItems: 'center',
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  heroEmblem: { position: 'absolute', top: -10, right: -6 },
  heroLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: 'rgba(255,255,255,0.75)' },
  heroPrayer: { fontSize: 32, fontWeight: '700', letterSpacing: -1, color: '#FFFFFF', marginTop: 10 },
  heroTime: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  loadingCard: {
    marginTop: 22,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: { fontSize: 13 },
  groupCard: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  prayerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  prayerIcon: { height: 34, width: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  prayerName: { fontSize: 14, fontWeight: '600' },
  prayerTag: { fontSize: 10.5, fontWeight: '700', marginTop: 2 },
  prayerTime: { fontSize: 15, fontWeight: '700' },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  methodValue: { fontSize: 11.5, marginTop: 3 },
  notice: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: 20, padding: 15, marginTop: 18 },
  noticeTitle: { fontSize: 13, fontWeight: '700' },
  noticeText: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  retry: { height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 11 },
  retryText: { fontSize: 14, fontWeight: '700' },
  methodOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  methodOptionText: { fontSize: 14, fontWeight: '600', flex: 1, marginRight: 12 },
});
