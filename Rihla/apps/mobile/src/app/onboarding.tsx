import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/theme-context';

export default function OnboardingScreen() {
  const [selected, setSelected] = useState<'deepen' | 'revert' | null>(null);
  const { colors } = useTheme();

  return (
    <LinearGradient colors={colors.gradientPromo as [string, string, string]} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <Ionicons name="moon" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.logoText}>Rihla</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.cardStack}>
            <View style={[styles.stackCard, styles.stackCardBack, { backgroundColor: 'rgba(255,255,255,0.10)' }]}>
              <Ionicons name="hand-left" size={20} color="rgba(255,255,255,0.85)" />
            </View>
            <View style={[styles.stackCard, styles.stackCardMid, { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
              <Ionicons name="book" size={22} color="rgba(255,255,255,0.92)" />
            </View>
            <View style={[styles.stackCard, styles.stackCardFront, { backgroundColor: 'rgba(255,255,255,0.24)' }]}>
              <Ionicons name="moon" size={24} color="#FFFFFF" />
              <Text style={styles.stackCardLabel}>Rihla</Text>
            </View>
          </View>

          <Text style={styles.title}>Ready to deepen{'\n'}your practice?</Text>
          <Text style={styles.subtitle}>Prayer, Quran and daily reflection — brought together in one calm space.</Text>
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity
            style={[styles.card, selected === 'deepen' && styles.cardSelected]}
            onPress={() => setSelected('deepen')}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.cardIcon, selected === 'deepen' && styles.cardIconSelected]}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Deepen my practice</Text>
                <Text style={styles.cardSubtitle}>I already practise Islam</Text>
              </View>
            </View>
            {selected === 'deepen' && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, selected === 'revert' && styles.cardSelected]}
            onPress={() => setSelected('revert')}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.cardIcon, selected === 'revert' && styles.cardIconSelected]}>
                <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.cardTitle}>New / revert</Text>
                <Text style={styles.cardSubtitle}>I am early in my journey</Text>
              </View>
            </View>
            {selected === 'revert' && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.continueButton, !selected && styles.continueDisabled]}
            disabled={!selected}
            onPress={() => router.replace('/(tabs)/home')}
          >
            <Text style={styles.continueText}>Begin, free of charge</Text>
          </TouchableOpacity>

          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginLink}>Log in</Text>
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 22 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  logoMark: {
    height: 30,
    width: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
  hero: { flex: 1, justifyContent: 'center' },
  cardStack: { height: 170, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stackCard: {
    position: 'absolute',
    width: 120,
    height: 150,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stackCardBack: { transform: [{ rotate: '-14deg' }, { translateX: -46 }] },
  stackCardMid: { transform: [{ rotate: '10deg' }, { translateX: 44 }] },
  stackCardFront: { transform: [{ rotate: '-2deg' }] },
  stackCardLabel: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  title: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.8, lineHeight: 38 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.72)', textAlign: 'center', marginTop: 14, lineHeight: 19, paddingHorizontal: 12 },
  bottom: { paddingBottom: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  cardSelected: { borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.14)' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: {
    height: 36,
    width: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconSelected: { backgroundColor: 'rgba(255,255,255,0.22)' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  cardSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  continueButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    alignItems: 'center',
    marginTop: 10,
  },
  continueDisabled: { opacity: 0.45 },
  continueText: { fontSize: 15, fontWeight: '800', color: '#12132A' },
  loginText: { fontSize: 12, textAlign: 'center', marginTop: 16, color: 'rgba(255,255,255,0.7)' },
  loginLink: { fontWeight: '800', color: '#FFFFFF' },
});
