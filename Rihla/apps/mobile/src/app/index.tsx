import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';

const palette = {
  light: {
    background: '#F3F9F5',
    logo: '#0C6048',
    text: '#123B2F',
    subtitle: '#668075',
  },
  dark: {
    background: '#0F2E23',
    logo: '#79D2AE',
    text: '#FFFFFF',
    subtitle: '#B8C4BF',
  },
};

export default function SplashScreen() {
  const colorScheme = useColorScheme();
  const colors = palette[colorScheme === 'dark' ? 'dark' : 'light'];

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.brandLockup}>
        <View style={styles.mosqueBackdrop}>
          <BrandMark color={colors.logo} size={256} />
        </View>

        <View style={styles.wordmark}>
          <Text style={[styles.title, { color: colors.text }]}>Rihla</Text>
          <Text style={[styles.subtitle, { color: colors.subtitle }]}>Din reise mot Allah</Text>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLockup: {
    width: '100%',
    height: 390,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mosqueBackdrop: {
    position: 'absolute',
    opacity: 0.9,
  },
  wordmark: {
    alignItems: 'center',
    marginTop: 172,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 54,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
});
