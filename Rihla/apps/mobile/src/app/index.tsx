import { Text, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.iconWrapper}>
        <Text style={styles.moon}>☾</Text>
        <View style={styles.dome} />
        <View style={styles.arch} />
      </View>

      <Text style={styles.title}>Rihla</Text>
      <Text style={styles.subtitle}>Din reise mot Allah</Text>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F2E23',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 24,
    height: 140,
  },
  moon: {
    fontSize: 28,
    color: '#5DCAA5',
    marginBottom: 8,
  },
  dome: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#5DCAA5',
    marginBottom: -4,
    zIndex: 2,
  },
  arch: {
    width: 90,
    height: 100,
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    borderWidth: 2,
    borderColor: '#5DCAA5',
    borderBottomWidth: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#B8C4BF',
  },
});
