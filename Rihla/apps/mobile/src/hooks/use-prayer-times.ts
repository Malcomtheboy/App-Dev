import * as Location from 'expo-location';
import { CalculationMethod, Coordinates, PrayerTimes } from 'adhan';
import { useEffect, useMemo, useState } from 'react';

export type MethodKey = 'MuslimWorldLeague' | 'Egyptian' | 'Karachi' | 'UmmAlQura' | 'NorthAmerica' | 'MoonsightingCommittee';

export const calculationMethods: { key: MethodKey; label: string }[] = [
  { key: 'MuslimWorldLeague', label: 'Muslim World League' },
  { key: 'UmmAlQura', label: 'Umm al-Qura, Makkah' },
  { key: 'Egyptian', label: 'Egyptian General Authority' },
  { key: 'Karachi', label: 'University of Islamic Sciences, Karachi' },
  { key: 'NorthAmerica', label: 'ISNA, North America' },
  { key: 'MoonsightingCommittee', label: 'Moonsighting Committee' },
];

// Shared hook: current location, today's prayer times (via `adhan`), and a live clock.
// Used by both the Prayer times screen and the Reminders sheet on Progress, so both
// speak from the same real calculation instead of duplicating the location/permission
// plumbing.
export function usePrayerTimes() {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [place, setPlace] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [method, setMethod] = useState<MethodKey>('MuslimWorldLeague');

  useEffect(() => {
    let live = true;

    const load = async () => {
      setLoading(true);
      setMessage(null);

      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          throw new Error('Turn on Location Services to get accurate prayer times for where you are.');
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Allow location access so Rihla can calculate prayer times for your area.');
        }

        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!live) return;

        setCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude });

        try {
          const [address] = await Location.reverseGeocodeAsync(location.coords);
          if (live && address) {
            setPlace([address.city ?? address.subregion, address.country].filter(Boolean).join(', '));
          }
        } catch {
          // Reverse geocoding is a nice-to-have — the times still work without it.
        }

        setLoading(false);
      } catch (error) {
        if (live) {
          setMessage(error instanceof Error ? error.message : 'We could not read your location.');
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      live = false;
    };
  }, [retryCount]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const times = useMemo(() => {
    if (!coords) return null;
    const coordinates = new Coordinates(coords.latitude, coords.longitude);
    const params = CalculationMethod[method]();
    return new PrayerTimes(coordinates, now, params);
  }, [coords, method, now]);

  return {
    coords,
    place,
    loading,
    message,
    retry: () => setRetryCount((v) => v + 1),
    now,
    method,
    setMethod,
    times,
  };
}
