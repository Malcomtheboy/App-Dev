import { View, Text, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Text style={styles.moon}>☾</Text>
        <View style={styles.dome} />
        <View style={styles.arch} />
      </View>

      <Text style={styles.title}>Rihla</Text>
      <Text style={styles.subtitle}>Din reise mot Allah</Text>

      <View style={styles.homeIndicator} />
    </View>
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
  homeIndicator: {
    position: 'absolute',
    bottom: 30,
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A4A44',
  },
});