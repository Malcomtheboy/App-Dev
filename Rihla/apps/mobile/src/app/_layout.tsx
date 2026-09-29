import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { ThemeProvider } from '@/theme/theme-context';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (user === undefined) return;

    const currentRoute = segments[0];
    const isInTabs = currentRoute === '(tabs)' || currentRoute === 'home' || currentRoute === 'quran-hadith' || currentRoute === 'chat'
      || currentRoute === 'progress' || currentRoute === 'profile' || currentRoute === 'qibla' || currentRoute === 'prayer-times';
    const isAuthRoute = !currentRoute || currentRoute === 'login' || currentRoute === 'register' || currentRoute === 'onboarding';

    if (!user && isInTabs) {
      router.replace('/login');
    } else if (user && isAuthRoute) {
      router.replace('/home');
    }
  }, [router, segments, user]);

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
