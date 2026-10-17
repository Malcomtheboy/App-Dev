import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/theme/theme-context';

const KAABA = {
  latitude: 21.4225,
  longitude: 39.8262,
};

const GOLD = '#E2C275';
const MINT = '#7FE4AF';

const rad = (value: number) => (value * Math.PI) / 180;
const normalize = (value: number) => (value + 360) % 360;

function qiblaBearing(latitude: number, longitude: number) {
  const lat = rad(latitude);
  const kaabaLat = rad(KAABA.latitude);
  const delta = rad(KAABA.longitude - longitude);

  const y = Math.sin(delta) * Math.cos(kaabaLat);
  const x = Math.cos(lat) * Math.sin(kaabaLat) - Math.sin(lat) * Math.cos(kaabaLat) * Math.cos(delta);

  return normalize((Math.atan2(y, x) * 180) / Math.PI);
}

// The compass card is a dial that turns with the phone, so north stays north
// and the Kaaba marker sits on the ring at the Qibla bearing. When the marker
// is under the pointer at the top, the phone is facing the Kaaba.
const DIAL = 264;
const RADIUS = DIAL / 2;
const MARKER = 40;
const PAD = 26;
const TICKS = Array.from({ length: 72 }, (_, index) => index * 5);
const CARDINALS = [
  { label: 'N', angle: 0 },
  { label: 'E', angle: 90 },
  { label: 'S', angle: 180 },
  { label: 'W', angle: 270 },
] as const;

function polar(angle: number, radius: number, size: number) {
  const a = rad(angle);
  return { left: RADIUS + radius * Math.sin(a) - size / 2, top: RADIUS - radius * Math.cos(a) - size / 2 };
}

export default function QiblaScreen() {
  const { colors } = useTheme();

  const [bearing, setBearing] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  const pulse = useSharedValue(0);
  const dialAngle = useSharedValue(0);
  const dialTarget = useRef(0);

  const setup = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      throw new Error('Turn on Location Services to find the Qibla direction.');
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Allow location access to calculate the direction to the Kaaba.');
    }

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

        locationSub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 10, timeInterval: 10000 },
          (location) => {
            setBearing(qiblaBearing(location.coords.latitude, location.coords.longitude));
          }
        );

        headingSub = await Location.watchHeadingAsync((next) => {
          const value = next.trueHeading >= 0 ? next.trueHeading : next.magHeading;
          setHeading(normalize(value));
        });
      } catch (error) {
        if (live) {
          setMessage(error instanceof Error ? error.message : 'We could not read your location or compass.');
          setLoading(false);
        }
      }
    };

    void start();

    return () => {
      live = false;
      locationSub?.remove();
      headingSub?.remove();
    };
  }, [retry, setup]);

  // Turn the dial the short way round, so crossing north doesn't spin it 360°.
  useEffect(() => {
    if (heading === null) return;
    const delta = ((((-heading - dialTarget.current) % 360) + 540) % 360) - 180;
    dialTarget.current += delta;
    dialAngle.value = withTiming(dialTarget.current, { duration: 180 });
  }, [heading, dialAngle]);

  const turn = bearing !== null && heading !== null ? ((bearing - heading + 540) % 360) - 180 : null;
  const aligned = turn !== null && Math.abs(turn) <= 5;

  const status =
    turn === null
      ? 'Move your phone slowly to calibrate'
      : aligned
        ? 'You are facing the Kaaba'
        : `Turn ${Math.abs(Math.round(turn))}° ${turn > 0 ? 'right' : 'left'}`;

  useEffect(() => {
    if (!aligned) {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 200 });
      return;
    }

    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 1100 }), withTiming(0, { duration: 1100 })), -1);
    return () => cancelAnimation(pulse);
  }, [aligned, pulse]);

  const dialStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${dialAngle.value}deg` }] }));
  const uprightStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${-dialAngle.value}deg` }] }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: aligned ? 0.1 + pulse.value * 0.22 : 0,
    transform: [{ scale: 1 + pulse.value * 0.1 }],
  }));

  const ringColor = aligned ? 'rgba(127,228,175,0.55)' : 'rgba(255,255,255,0.16)';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={21} color={colors.textPrimary} />
          </TouchableOpacity>

          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Qibla</Text>
            <Text style={[styles.brand, { color: colors.textTertiary }]}>RIHLA</Text>
          </View>

          <View style={[styles.logoMark, { backgroundColor: colors.accentTint, borderColor: colors.accent }]}>
            <Ionicons name="moon-outline" size={17} color={colors.accent} />
          </View>
        </View>

        <View style={styles.intro}>
          <Text style={[styles.kicker, { color: colors.accent }]}>QIBLA DIRECTION</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Face the Kaaba</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            Turn until the Kaaba sits under the pointer.
          </Text>
        </View>

        <LinearGradient colors={['#06231A', '#0A3A2A', '#06231A']} locations={[0, 0.55, 1]} style={styles.card}>
          <View style={styles.livePill}>
            <View style={[styles.liveDot, { backgroundColor: heading === null ? GOLD : MINT }]} />
            <Text style={styles.liveText}>{heading === null ? 'CALIBRATING' : 'LIVE'}</Text>
          </View>

          <View style={styles.compass}>
            <Animated.View style={[styles.glow, glowStyle]} />

            <Animated.View style={[styles.dial, { borderColor: ringColor }, dialStyle]}>
              {TICKS.map((angle) => {
                const major = angle % 90 === 0;
                const mid = angle % 30 === 0;
                return (
                  <View key={angle} style={[styles.tickWrap, { transform: [{ rotate: `${angle}deg` }] }]}>
                    <View
                      style={{
                        width: major ? 2.5 : 1.5,
                        height: major ? 15 : mid ? 10 : 5,
                        marginTop: 7,
                        borderRadius: 1,
                        backgroundColor: angle === 0 ? GOLD : `rgba(255,255,255,${major ? 0.7 : mid ? 0.45 : 0.2})`,
                      }}
                    />
                  </View>
                );
              })}

              {CARDINALS.map((item) => (
                <Animated.View key={item.label} style={[styles.cardinal, polar(item.angle, 92, 24), uprightStyle]}>
                  <Text style={[styles.cardinalText, item.label === 'N' && { color: GOLD }]}>{item.label}</Text>
                </Animated.View>
              ))}

              {bearing !== null && (
                <Animated.View
                  style={[
                    styles.marker,
                    polar(bearing, RADIUS - 10, MARKER),
                    aligned && styles.markerAligned,
                    uprightStyle,
                  ]}
                >
                  <Ionicons name="cube" size={19} color={aligned ? MINT : GOLD} />
                </Animated.View>
              )}
            </Animated.View>

            <View style={styles.pointer} />

            <View style={styles.readout}>
              <Text style={styles.readoutValue}>{turn === null ? '–' : `${Math.abs(Math.round(turn))}°`}</Text>
              <Text style={styles.readoutCaption}>
                {turn === null ? 'no compass yet' : aligned ? 'aligned' : turn > 0 ? 'to the right' : 'to the left'}
              </Text>
            </View>
          </View>

          <View style={[styles.status, aligned && styles.statusAligned]}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name={aligned ? 'checkmark-circle' : 'navigate'} size={19} color={aligned ? '#86F0BB' : GOLD} />
            )}

            <Text style={styles.statusText}>{loading ? 'Finding your direction…' : status}</Text>
          </View>

          {aligned && <Text style={styles.accepted}>MAY YOUR PRAYER BE ACCEPTED</Text>}
        </LinearGradient>

        {bearing !== null && (
          <View style={[styles.bearing, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View>
              <Text style={[styles.label, { color: colors.textTertiary, marginTop: 0 }]}>QIBLA BEARING</Text>
              <Text style={[styles.bearingSub, { color: colors.textSecondary }]}>Direction from true north</Text>
            </View>

            <Text style={[styles.degree, { color: colors.textPrimary }]}>{Math.round(bearing)}°</Text>
          </View>
        )}

        {heading !== null && (
          <View style={styles.stats}>
            <Stat label="YOUR HEADING" value={`${Math.round(heading)}°`} icon="compass-outline" color={colors.accent} colors={colors} />
            <Stat
              label="ALIGNMENT"
              value={aligned ? 'Aligned' : `${Math.abs(Math.round(turn ?? 0))}° away`}
              icon={aligned ? 'checkmark' : 'navigate'}
              color={colors.accent}
              colors={colors}
            />
          </View>
        )}

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
              onPress={() => setRetry((value) => value + 1)}
              style={[styles.retry, { backgroundColor: colors.accent }]}
            >
              <Text style={[styles.retryText, { color: colors.accentOn }]}>Try again</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={[styles.tip, { color: colors.textTertiary }]}>
          Keep your phone flat and away from metal objects for the best compass accuracy.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  icon,
  color,
  colors,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name={icon} size={19} color={color} />
      <Text style={[styles.label, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  content: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    padding: 18,
    paddingBottom: 116,
  },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  logoMark: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  brand: { fontSize: 8, fontWeight: '700', letterSpacing: 1.5, textAlign: 'center', marginTop: 2 },

  intro: { alignItems: 'center', marginTop: 28 },
  kicker: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  title: { fontSize: 30, fontWeight: '700', letterSpacing: -1, marginTop: 7 },
  sub: { fontSize: 13, marginTop: 7, textAlign: 'center' },

  card: {
    borderRadius: 32,
    marginTop: 24,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },

  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { color: 'rgba(255,255,255,0.78)', fontSize: 9, fontWeight: '700', letterSpacing: 1.4 },

  compass: {
    width: DIAL + PAD * 2,
    height: DIAL + PAD * 2,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  glow: {
    position: 'absolute',
    width: DIAL - 20,
    height: DIAL - 20,
    borderRadius: (DIAL - 20) / 2,
    backgroundColor: '#86F0BB',
  },

  dial: {
    position: 'absolute',
    width: DIAL,
    height: DIAL,
    borderRadius: RADIUS,
    borderWidth: 1,
  },

  tickWrap: {
    position: 'absolute',
    left: -1,
    top: -1,
    width: DIAL,
    height: DIAL,
    alignItems: 'center',
  },

  cardinal: {
    position: 'absolute',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardinalText: { color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: '700' },

  marker: {
    position: 'absolute',
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    backgroundColor: '#0C2E22',
    borderWidth: 1.5,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerAligned: { borderColor: MINT, backgroundColor: '#0F3B2B' },

  pointer: {
    position: 'absolute',
    top: 1,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },

  readout: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readoutValue: { color: '#FFFFFF', fontSize: 34, fontWeight: '700', letterSpacing: -1 },
  readoutCaption: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginTop: 2,
  },

  status: {
    minHeight: 46,
    marginTop: 6,
    paddingHorizontal: 19,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: 'rgba(255,255,255,.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.08)',
  },
  statusAligned: { backgroundColor: 'rgba(45,160,104,.22)', borderColor: 'rgba(111,239,176,.32)' },
  statusText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  accepted: { marginTop: 14, color: 'rgba(255,255,255,.45)', fontSize: 9, letterSpacing: 2.1 },

  bearing: {
    minHeight: 91,
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  label: { fontSize: 8, fontWeight: '800', letterSpacing: 1.3, marginTop: 9 },
  bearingSub: { fontSize: 11, marginTop: 5 },
  degree: { fontSize: 40, fontWeight: '700', letterSpacing: -2 },

  stats: { flexDirection: 'row', gap: 12, marginTop: 12 },
  stat: { flex: 1, minHeight: 112, borderRadius: 21, borderWidth: 1, padding: 15 },
  statValue: { fontSize: 20, fontWeight: '700', marginTop: 5 },

  notice: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: 20, padding: 15, marginTop: 16 },
  flex: { flex: 1 },
  noticeTitle: { fontSize: 13, fontWeight: '700' },
  noticeText: { fontSize: 12, lineHeight: 18, marginTop: 4 },

  retry: { height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 11 },
  retryText: { fontSize: 14, fontWeight: '700' },

  tip: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginHorizontal: 24, marginTop: 20 },
});
