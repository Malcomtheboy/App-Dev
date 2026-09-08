import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
  const [selected, setSelected] = useState<'deepen' | 'revert' | null>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>☾</Text>
        </View>

      <Text style={styles.title}>Velkommen til Rihla</Text>
      <Text style={styles.subtitle}>Hvor starter reisen din?</Text>

      <TouchableOpacity
        style={[styles.card, selected === 'deepen' && styles.cardSelected]}
        onPress={() => setSelected('deepen')}
      >
        <Text style={styles.cardTitle}>Fordype meg</Text>
        <Text style={styles.cardSubtitle}>Jeg praktiserer allerede</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, selected === 'revert' && styles.cardSelected]}
        onPress={() => setSelected('revert')}
      >
        <Text style={styles.cardTitle}>Ny / revert</Text>
        <Text style={styles.cardSubtitle}>Jeg er tidlig i reisen</Text>
      </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueButton, !selected && styles.continueDisabled]}
          disabled={!selected}
          onPress={() => router.replace('/home')}
        >
          <Text style={styles.continueText}>Fortsett</Text>
        </TouchableOpacity>

        <Text style={styles.loginText}>
          Har du konto? <Text style={styles.loginLink}>Logg inn</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0C0B',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#173428',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoIcon: { fontSize: 24, color: '#5DCAA5' },
  title: {
    fontSize: 20,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#8B928E',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#141816',
    borderWidth: 1,
    borderColor: '#1F2521',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardSelected: {
    borderColor: '#5DCAA5',
  },
  cardTitle: { fontSize: 14, fontWeight: '500', color: '#fff' },
  cardSubtitle: { fontSize: 11, color: '#8B928E', marginTop: 2 },
  continueButton: {
    backgroundColor: '#5DCAA5',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  continueDisabled: {
    opacity: 0.4,
  },
  continueText: { fontSize: 14, fontWeight: '600', color: '#04342C' },
  loginText: {
    fontSize: 11,
    color: '#8B928E',
    textAlign: 'center',
    marginTop: 16,
  },
  loginLink: {
    color: '#5DCAA5',
    fontWeight: '500',
  },
});
