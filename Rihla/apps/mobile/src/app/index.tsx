import { Image, StyleSheet, useColorScheme } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#00251D' : '#F4F8F6' }]} edges={['top', 'bottom']}>
      <Image
        accessibilityLabel="Rihla – Din reise mot Allah"
        resizeMode="contain"
        source={
          isDark
            ? require('@/assets/images/rihla-logo-dark.png')
            : require('@/assets/images/rihla-logo-light.png')
        }
        style={styles.logo}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '48%',
    maxWidth: 200,
    aspectRatio: 520 / 760,
    transform: [{ translateY: -36 }],
  },
});
