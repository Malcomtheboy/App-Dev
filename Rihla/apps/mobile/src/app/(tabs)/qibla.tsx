import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/theme/theme-context';

const KAABA = {
  latitude: 21.4225,
  longitude: 39.8262,
};

const rad = (value: number) => (value * Math.PI) / 180;
const normalize = (value: number) => (value + 360) % 360;

function qiblaBearing(latitude: number, longitude: number) {
  const lat = rad(latitude);
  const kaabaLat = rad(KAABA.latitude);
  const delta = rad(KAABA.longitude - longitude);

  const y = Math.sin(delta) * Math.cos(kaabaLat);

  const x =
    Math.cos(lat) * Math.sin(kaabaLat) -
    Math.sin(lat) *
      Math.cos(kaabaLat) *
      Math.cos(delta);

  return normalize((Math.atan2(y, x) * 180) / Math.PI);
}

export default function QiblaScreen() {
  const { colors } = useTheme();

  const [bearing, setBearing] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  const pulse = useSharedValue(0);

  const setup = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    const servicesEnabled =
      await Location.hasServicesEnabledAsync();

    if (!servicesEnabled) {
      throw new Error(
        'Turn on Location Services to find the Qibla direction.'
      );
    }

    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      throw new Error(
        'Allow location access to calculate the direction to the Kaaba.'
      );
    }

    const location =
      await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

    setBearing(
      qiblaBearing(
        location.coords.latitude,
        location.coords.longitude
      )
    );

    setLoading(false);
  }, []);

  useEffect(() => {
    let live = true;

    let locationSub:
      | Location.LocationSubscription
      | undefined;

    let headingSub:
      | Location.LocationSubscription
      | undefined;

    const start = async () => {
      try {
        await setup();

        if (!live) return;

        locationSub =
          await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 10,
              timeInterval: 10000,
            },
            (location) => {
              setBearing(
                qiblaBearing(
                  location.coords.latitude,
                  location.coords.longitude
                )
              );
            }
          );

        headingSub =
          await Location.watchHeadingAsync((next) => {
            const value =
              next.trueHeading >= 0
                ? next.trueHeading
                : next.magHeading;

            setHeading(normalize(value));
          });
      } catch (error) {
        if (live) {
          setMessage(
            error instanceof Error
              ? error.message
              : 'We could not read your location or compass.'
          );

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

  const turn =
    bearing !== null && heading !== null
      ? ((bearing - heading + 540) % 360) - 180
      : null;

  const aligned =
    turn !== null && Math.abs(turn) <= 5;

  const status =
    turn === null
      ? 'Move your phone slowly to calibrate'
      : aligned
        ? 'You are facing the Kaaba'
        : `Turn ${Math.abs(Math.round(turn))}° ${
            turn > 0 ? 'right' : 'left'
          }`;

  useEffect(() => {
    if (!aligned) {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 200 });
      return;
    }

    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 1100 }), withTiming(0, { duration: 1100 })),
      -1
    );

    return () => cancelAnimation(pulse);
  }, [aligned, pulse]);

  const auraStyle = useAnimatedStyle(() => ({
    opacity: aligned ? 0.12 + pulse.value * (0.45 - 0.12) : 0.1,
    transform: [{ scale: aligned ? 1 + pulse.value * 0.18 : 1 }],
  }));

  return (
    <SafeAreaView
      style={[
        styles.safe,
        { backgroundColor: colors.background },
      ]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.back,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="chevron-back"
              size={21}
              color={colors.textPrimary}
            />
          </TouchableOpacity>

          <View>
            <Text
              style={[
                styles.headerTitle,
                { color: colors.textPrimary },
              ]}
            >
              Qibla
            </Text>

            <Text
              style={[
                styles.brand,
                { color: colors.textTertiary },
              ]}
            >
              RIHLA
            </Text>
          </View>

          <View style={[styles.logoMark, { backgroundColor: colors.accentTint, borderColor: colors.accent }]}>
            <Ionicons name="moon-outline" size={17} color={colors.accent} />
          </View>
        </View>

        <View style={styles.intro}>
          <Text
            style={[
              styles.kicker,
              { color: colors.accent },
            ]}
          >
            QIBLA DIRECTION
          </Text>

          <Text
            style={[
              styles.title,
              { color: colors.textPrimary },
            ]}
          >
            Follow the Kaaba
          </Text>

          <Text
            style={[
              styles.sub,
              { color: colors.textSecondary },
            ]}
          >
            Turn until the arrow meets the Kaaba.
          </Text>
        </View>

        <LinearGradient
          colors={[
            '#071A14',
            '#082B20',
            '#073C2A',
            '#041D16',
          ]}
          locations={[0, 0.35, 0.7, 1]}
          style={styles.card}
        >
          <Text style={styles.live}>
            {heading === null
              ? '•  CALIBRATING'
              : '•  LIVE QIBLA'}
          </Text>

          <View style={styles.compass}>
            <View style={styles.outerRing} />
            <View style={styles.middleRing} />
            <View style={styles.innerRing} />

            <View
              style={[
                styles.guide,
                {
                  transform: [
                    {
                      rotate: `${turn ?? 0}deg`,
                    },
                  ],
                },
              ]}
            >
              <View style={styles.arrowHead} />
              <View style={styles.directionLine} />
            </View>

            <Animated.View style={[styles.aura, auraStyle]} />

            <View style={styles.degreeBadge}>
              <Text style={styles.degreeValue}>{Math.abs(Math.round(turn ?? 0))}°</Text>
              <Text style={styles.degreeCaption}>{aligned ? 'aligned' : turn !== null && turn > 0 ? 'right' : 'left'}</Text>
            </View>

            <View style={styles.kaabaArch} />

            <View style={styles.kaaba}>
              <View style={styles.kaabaBody}>
                <View style={styles.kaabaBand} />
                <View style={styles.kaabaDoor} />
              </View>
            </View>
          </View>

          <View
            style={[
              styles.status,
              aligned && styles.statusAligned,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons
                name={
                  aligned
                    ? 'checkmark-circle'
                    : 'navigate'
                }
                size={20}
                color={
                  aligned
                    ? '#86F0BB'
                    : '#F7D98C'
                }
              />
            )}

            <Text style={styles.statusText}>
              {loading
                ? 'Finding your direction…'
                : status}
            </Text>
          </View>

          {aligned && (
            <Text style={styles.accepted}>
              MAY YOUR JOURNEY BE ACCEPTED
            </Text>
          )}
        </LinearGradient>

        {bearing !== null && (
          <View
            style={[
              styles.bearing,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View>
              <Text
                style={[
                  styles.label,
                  {
                    color: colors.textTertiary,
                  },
                ]}
              >
                QIBLA BEARING
              </Text>

              <Text
                style={[
                  styles.bearingSub,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Direction from true north
              </Text>
            </View>

            <Text
              style={[
                styles.degree,
                { color: colors.textPrimary },
              ]}
            >
              {Math.round(bearing)}°
            </Text>
          </View>
        )}

        {heading !== null && (
          <View style={styles.stats}>
            <Stat
              label="YOUR HEADING"
              value={`${Math.round(heading)}°`}
              icon="compass-outline"
              color="#7FE4AF"
              colors={colors}
            />

            <Stat
              label="ALIGNMENT"
              value={
                aligned
                  ? 'Aligned'
                  : `${Math.abs(
                      Math.round(turn ?? 0)
                    )}° away`
              }
              icon={
                aligned
                  ? 'checkmark'
                  : 'navigate'
              }
              color="#E6C46C"
              colors={colors}
            />
          </View>
        )}

        {message && (
          <>
            <View
              style={[
                styles.notice,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={22}
                color="#E0BB61"
              />

              <View style={styles.flex}>
                <Text
                  style={[
                    styles.noticeTitle,
                    {
                      color:
                        colors.textPrimary,
                    },
                  ]}
                >
                  Location permission needed
                </Text>

                <Text
                  style={[
                    styles.noticeText,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  {message}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() =>
                setRetry(
                  (value) => value + 1
                )
              }
              style={[
                styles.retry,
                {
                  backgroundColor:
                    colors.accent,
                },
              ]}
            >
              <Text
                style={[
                  styles.retryText,
                  {
                    color: colors.accentOn,
                  },
                ]}
              >
                Try again
              </Text>
            </TouchableOpacity>
          </>
        )}

        <Text
          style={[
            styles.tip,
            {
              color: colors.textTertiary,
            },
          ]}
        >
          Keep your phone flat and away from metal
          objects for the best compass accuracy.
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
    <View
      style={[
        styles.stat,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={19}
        color={color}
      />

      <Text
        style={[
          styles.label,
          { color: colors.textTertiary },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.statValue,
          { color: colors.textPrimary },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  content: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    padding: 18,
    paddingBottom: 116,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoMark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },

  brand: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 2,
  },

  intro: {
    alignItems: 'center',
    marginTop: 28,
  },

  kicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -1,
    marginTop: 7,
  },

  sub: {
    fontSize: 13,
    marginTop: 7,
  },

  card: {
    height: 405,
    borderRadius: 32,
    marginTop: 26,
    padding: 22,
    alignItems: 'center',
    overflow: 'hidden',
  },

  live: {
    color: 'rgba(255,255,255,.7)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.3,
  },

  compass: {
    width: 260,
    height: 260,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  outerRing: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },

  middleRing: {
    position: 'absolute',
    width: 205,
    height: 205,
    borderRadius: 102.5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
  },

  innerRing: {
    position: 'absolute',
    width: 158,
    height: 158,
    borderRadius: 79,
    borderWidth: 1.5,
    borderColor: 'rgba(119,231,175,0.40)',
  },

  guide: {
    position: 'absolute',
    width: 250,
    height: 250,
    alignItems: 'center',
  },

  arrowHead: {
    position: 'absolute',
    top: 7,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 19,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#F4D382',
  },

  directionLine: {
    position: 'absolute',
    top: 25,
    width: 2,
    height: 73,
    borderRadius: 2,
    backgroundColor: '#D5B764',
  },

  aura: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(134,240,187,0.22)',
  },

  degreeBadge: {
    position: 'absolute',
    height: 74,
    width: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -50 }],
    zIndex: 3,
  },

  degreeValue: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  degreeCaption: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 2,
    textTransform: 'uppercase',
  },

  kaabaArch: {
    position: 'absolute',
    bottom: 4,
    width: 148,
    height: 66,
    borderTopLeftRadius: 74,
    borderTopRightRadius: 74,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  kaaba: {
    alignItems: 'center',
    zIndex: 2,
    transform: [{ translateY: 38 }],
  },

  kaabaBody: {
    width: 44,
    height: 36,
    backgroundColor: '#0B0D0C',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(215,184,97,0.32)',
    alignItems: 'center',
    overflow: 'hidden',
  },

  kaabaBand: {
    width: '100%',
    height: 3.5,
    marginTop: 8,
    backgroundColor: '#C9A961',
  },

  kaabaDoor: {
    width: 7,
    height: 11,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#C9A961',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  status: {
    minHeight: 46,
    paddingHorizontal: 19,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: 'rgba(255,255,255,.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.08)',
  },

  statusAligned: {
    backgroundColor: 'rgba(45,160,104,.22)',
    borderColor: 'rgba(111,239,176,.32)',
  },

  statusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  accepted: {
    marginTop: 14,
    color: 'rgba(255,255,255,.42)',
    fontSize: 9,
    letterSpacing: 2.1,
  },

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

  label: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginTop: 9,
  },

  bearingSub: {
    fontSize: 11,
    marginTop: 5,
  },

  degree: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -2,
  },

  stats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },

  stat: {
    flex: 1,
    minHeight: 112,
    borderRadius: 21,
    borderWidth: 1,
    padding: 15,
  },

  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 5,
  },

  notice: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 20,
    padding: 15,
    marginTop: 16,
  },

  flex: {
    flex: 1,
  },

  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },

  noticeText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  retry: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 11,
  },

  retryText: {
    fontSize: 14,
    fontWeight: '700',
  },

  tip: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginHorizontal: 24,
    marginTop: 20,
  },
});