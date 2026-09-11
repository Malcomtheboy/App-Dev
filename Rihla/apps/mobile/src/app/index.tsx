import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/theme-context';

export default function SplashScreen() {
  const { colors } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={colors.heroGradient as [string, string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.logoMark}>
        <Ionicons name="moon" size={30} color="#FFFFFF" />
      </View>

      <Text style={styles.title}>Rihla</Text>
      <Text style={styles.subtitle}>Your journey towards Allah</Text>

      <View style={styles.homeIndicator} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: {
    height: 84,
    width: 84,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 30,
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
