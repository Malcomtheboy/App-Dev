import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

const STORAGE_KEY = 'rihla:connectedCircle';
const defaultCircle: string[] = [];

// Shared across Progress and Profile — both screens read/write the same
// AsyncStorage key and reload on focus, so adding someone in one place shows
// up in the other without any extra wiring.
export function useConnectedCircle() {
  const [circle, setCircleState] = useState<string[]>(defaultCircle);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved) setCircleState(JSON.parse(saved));
      })
      .finally(() => setLoaded(true));
  }, []);

  useFocusEffect(reload);

  const addMember = useCallback((name: string) => {
    setCircleState((prev) => {
      const next = [...prev, name];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return { circle, addMember, loaded };
}
