import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/theme-context';

const KAABA = { latitude: 21.4225, longitude: 39.8262 };
const rad = (value: number) => (value * Math.PI) / 180;
const normalize = (value: number) => (value + 360) % 360;

function qiblaBearing(latitude: number, longitude: number) {
  const lat = rad(latitude), kaabaLat = rad(KAABA.latitude), delta = rad(KAABA.longitude - longitude);
  const y = Math.sin(delta) * Math.cos(kaabaLat);
  const x = Math.cos(lat) * Math.sin(kaabaLat) - Math.sin(lat) * Math.cos(kaabaLat) * Math.cos(delta);
  return normalize((Math.atan2(y, x) * 180) / Math.PI);
}

export default function QiblaScreen() {
  const { colors } = useTheme();
  const [bearing, setBearing] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;

  const setup = useCallback(async () => {
    setLoading(true); setMessage(null);
    if (!(await Location.hasServicesEnabledAsync())) throw new Error('Turn on Location Services to find the Qibla direction.');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('Allow location access to calculate the direction to the Kaaba.');
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setBearing(qiblaBearing(location.coords.latitude, location.coords.longitude));
    setLoading(false);
  }, []);

  useEffect(() => {
    let live = true;
    let locationSub: Location.LocationSubscription | undefined;
    let headingSub: Location.LocationSubscription | undefined;
    const start = async () => {
      try {
        await setup();
        if (!live) return;
        locationSub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 10, timeInterval: 10000 }, (location) => setBearing(qiblaBearing(location.coords.latitude, location.coords.longitude)));
        headingSub = await Location.watchHeadingAsync((next) => setHeading(normalize(next.trueHeading >= 0 ? next.trueHeading : next.magHeading)));
      } catch (error) {
        if (live) { setMessage(error instanceof Error ? error.message : 'We could not read your location or compass.'); setLoading(false); }
      }
    };
    void start();
    return () => { live = false; locationSub?.remove(); headingSub?.remove(); };
  }, [retry, setup]);

  const turn = bearing !== null && heading !== null ? ((bearing - heading + 540) % 360) - 180 : null;
  const aligned = turn !== null && Math.abs(turn) <= 5;
  const status = turn === null ? 'Move your phone slowly to calibrate' : aligned ? 'You are facing the Kaaba' : `Turn ${Math.abs(Math.round(turn))}° ${turn > 0 ? 'right' : 'left'}`;

  useEffect(() => {
    if (!aligned) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [aligned, pulse]);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.34] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.62] });

  return <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="chevron-back" size={21} color={colors.textPrimary} /></TouchableOpacity>
        <View><Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Qibla</Text><Text style={[styles.brand, { color: colors.textTertiary }]}>RIHLA</Text></View><View style={styles.back} />
      </View>
      <View style={styles.intro}><Text style={[styles.kicker, { color: colors.accent }]}>QIBLA DIRECTION</Text><Text style={[styles.title, { color: colors.textPrimary }]}>Follow the Kaaba</Text><Text style={[styles.sub, { color: colors.textSecondary }]}>Turn until the arrow meets the Kaaba.</Text></View>
      <LinearGradient colors={['#071A14', '#082B20', '#073C2A', '#041D16']} locations={[0, .35, .7, 1]} style={styles.card}>
        <View style={styles.glow} /><Text style={styles.live}>{heading === null ? '•  CALIBRATING' : '•  LIVE QIBLA'}</Text>
        <View style={styles.compass}>
          <View style={styles.outerRing} /><View style={styles.middleRing} /><View style={styles.mintRing} />
          <View style={[styles.guide, { transform: [{ rotate: `${turn ?? 0}deg` }] }]}><LinearGradient colors={['transparent', 'rgba(247,210,122,.4)', '#F4D382']} style={styles.line} /><Ionicons name="navigate" size={34} color="#F7D98C" style={styles.arrow} /></View>
          <Animated.View style={[styles.aura, { opacity: aligned ? pulseOpacity : 0.14, transform: [{ scale: aligned ? pulseScale : 1 }] }]} /><View style={styles.kaaba}><View style={styles.roof} /><View style={styles.kaabaBody}><View style={styles.band} /><View style={styles.door} /></View><Text style={styles.kaabaLabel}>KAABA</Text></View>
        </View>
        <View style={[styles.status, aligned && styles.statusAligned]}>{loading ? <ActivityIndicator color="#fff" /> : <Ionicons name={aligned ? 'checkmark-circle' : 'navigate'} size={20} color={aligned ? '#86F0BB' : '#F7D98C'} />}<Text style={styles.statusText}>{loading ? 'Finding your direction…' : status}</Text></View>
        {aligned && <Text style={styles.accepted}>MAY YOUR JOURNEY BE ACCEPTED</Text>}
      </LinearGradient>
      {bearing !== null && <View style={[styles.bearing, { backgroundColor: colors.surface, borderColor: colors.border }]}><View><Text style={[styles.label, { color: colors.textTertiary }]}>QIBLA BEARING</Text><Text style={[styles.bearingSub, { color: colors.textSecondary }]}>Direction from true north</Text></View><Text style={[styles.degree, { color: colors.textPrimary }]}>{Math.round(bearing)}°</Text></View>}
      {heading !== null && <View style={styles.stats}><Stat label="YOUR HEADING" value={`${Math.round(heading)}°`} icon="compass-outline" color="#7FE4AF" colors={colors} /><Stat label="ALIGNMENT" value={aligned ? 'Aligned' : `${Math.abs(Math.round(turn ?? 0))}° away`} icon={aligned ? 'checkmark' : 'navigate'} color="#E6C46C" colors={colors} /></View>}
      {message && <><View style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="location-outline" size={22} color="#E0BB61" /><View style={styles.flex}><Text style={[styles.noticeTitle, { color: colors.textPrimary }]}>Location permission needed</Text><Text style={[styles.noticeText, { color: colors.textSecondary }]}>{message}</Text></View></View><TouchableOpacity onPress={() => setRetry((value) => value + 1)} style={[styles.retry, { backgroundColor: colors.accent }]}><Text style={[styles.retryText, { color: colors.accentOn }]}>Try again</Text></TouchableOpacity></>}
      <Text style={[styles.tip, { color: colors.textTertiary }]}>Keep your phone flat and away from metal objects for the best compass accuracy.</Text>
    </ScrollView>
  </SafeAreaView>;
}

function Stat({ label, value, icon, color, colors }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; color: string; colors: ReturnType<typeof useTheme>['colors'] }) {
  return <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name={icon} size={19} color={color} /><Text style={[styles.label, { color: colors.textTertiary }]}>{label}</Text><Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { width: '100%', maxWidth: 460, alignSelf: 'center', padding: 18, paddingBottom: 116 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, headerTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' }, brand: { fontSize: 8, fontWeight: '700', letterSpacing: 1.5, textAlign: 'center', marginTop: 2 },
  intro: { alignItems: 'center', marginTop: 28 }, kicker: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4 }, title: { fontSize: 30, fontWeight: '700', letterSpacing: -1, marginTop: 7 }, sub: { fontSize: 13, marginTop: 7 }, card: { height: 405, borderRadius: 32, marginTop: 26, padding: 22, alignItems: 'center', overflow: 'hidden' }, glow: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(86,224,156,.13)', top: 100 }, live: { color: 'rgba(255,255,255,.7)', fontSize: 9, fontWeight: '700', letterSpacing: 1.3 },
  compass: { width: 252, height: 252, marginTop: 5, alignItems: 'center', justifyContent: 'center' }, outerRing: { position: 'absolute', width: 252, height: 252, borderRadius: 126, borderWidth: 1, borderColor: 'rgba(255,255,255,.20)' }, middleRing: { position: 'absolute', width: 202, height: 202, borderRadius: 101, borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' }, mintRing: { position: 'absolute', width: 146, height: 146, borderRadius: 73, borderWidth: 2, borderColor: 'rgba(134,240,187,.58)', backgroundColor: 'rgba(134,240,187,.05)' }, guide: { position: 'absolute', width: 252, height: 252, alignItems: 'center' }, line: { width: 2, height: 89, marginTop: 16 }, arrow: { position: 'absolute', top: 8 }, aura: { position: 'absolute', width: 118, height: 118, borderRadius: 59, backgroundColor: 'rgba(134,240,187,.34)' }, kaaba: { alignItems: 'center' }, roof: { width: 42, height: 11, backgroundColor: '#D7B861', borderTopLeftRadius: 3, borderTopRightRadius: 3 }, kaabaBody: { width: 50, height: 43, backgroundColor: '#111713', borderRadius: 4, alignItems: 'center' }, band: { width: '100%', height: 6, marginTop: 9, backgroundColor: '#D7B861' }, door: { width: 10, height: 14, marginTop: 5, backgroundColor: '#D7B861', borderTopLeftRadius: 2, borderTopRightRadius: 2 }, kaabaLabel: { marginTop: 8, color: 'rgba(255,255,255,.68)', fontSize: 9, fontWeight: '800', letterSpacing: 2.5 },
  status: { minHeight: 46, paddingHorizontal: 19, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: 'rgba(255,255,255,.09)', borderWidth: 1, borderColor: 'rgba(255,255,255,.08)' }, statusAligned: { backgroundColor: 'rgba(45,160,104,.22)', borderColor: 'rgba(111,239,176,.32)' }, statusText: { color: '#fff', fontSize: 13, fontWeight: '700' }, accepted: { marginTop: 14, color: 'rgba(255,255,255,.42)', fontSize: 9, letterSpacing: 2.1 },
  bearing: { minHeight: 91, marginTop: 16, borderRadius: 22, borderWidth: 1, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, label: { fontSize: 8, fontWeight: '800', letterSpacing: 1.3, marginTop: 9 }, bearingSub: { fontSize: 11, marginTop: 5 }, degree: { fontSize: 40, fontWeight: '700', letterSpacing: -2 }, stats: { flexDirection: 'row', gap: 12, marginTop: 12 }, stat: { flex: 1, minHeight: 112, borderRadius: 21, borderWidth: 1, padding: 15 }, statValue: { fontSize: 20, fontWeight: '700', marginTop: 5 }, notice: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: 20, padding: 15, marginTop: 16 }, flex: { flex: 1 }, noticeTitle: { fontSize: 13, fontWeight: '700' }, noticeText: { fontSize: 12, lineHeight: 18, marginTop: 4 }, retry: { height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 11 }, retryText: { fontSize: 14, fontWeight: '700' }, tip: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginHorizontal: 24, marginTop: 20 },
});
