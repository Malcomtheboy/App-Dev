import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';

const palette = {
  light: {
    background: '#F7FAF8',
    surface: '#FFFFFF',
    border: '#D7E5DD',
    text: '#123B2F',
    muted: '#668075',
    accent: '#0C6048',
    accentSoft: '#E3F2EA',
    buttonText: '#FFFFFF',
  },
  dark: {
    background: '#081C17',
    surface: '#102A22',
    border: '#24483B',
    text: '#F3F8F4',
    muted: '#A7BBB0',
    accent: '#83D8B5',
    accentSoft: '#173C30',
    buttonText: '#062A20',
  },
};

export default function OnboardingScreen() {
  const [selected, setSelected] = useState<'deepen' | 'revert' | null>(null);
  const colorScheme = useColorScheme();
  const colors = palette[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <BrandMark color={colors.accent} size={48} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Velkommen til Rihla</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Hvor starter reisen din?</Text>

        <TouchableOpacity
          accessibilityRole="radio"
          accessibilityState={{ selected: selected === 'deepen' }}
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
            selected === 'deepen' && { backgroundColor: colors.accentSoft, borderColor: colors.accent },
          ]}
          onPress={() => setSelected('deepen')}
        >
          <View style={[styles.optionIcon, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.optionEmoji, { color: colors.accent }]}>✦</Text>
          </View>
          <View style={styles.optionCopy}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Fordype meg</Text>
            <Text style={[styles.cardSubtitle, { color: colors.muted }]}>Jeg praktiserer allerede</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="radio"
          accessibilityState={{ selected: selected === 'revert' }}
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
            selected === 'revert' && { backgroundColor: colors.accentSoft, borderColor: colors.accent },
          ]}
          onPress={() => setSelected('revert')}
        >
          <View style={[styles.optionIcon, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.optionEmoji, { color: colors.accent }]}>⌁</Text>
          </View>
          <View style={styles.optionCopy}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Ny / revert</Text>
            <Text style={[styles.cardSubtitle, { color: colors.muted }]}>Jeg er tidlig i reisen</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.accent }, !selected && styles.continueDisabled]}
          disabled={!selected}
          onPress={() => router.replace('/home')}
        >
          <Text style={[styles.continueText, { color: colors.buttonText }]}>Fortsett</Text>
        </TouchableOpacity>

        <Text style={[styles.loginText, { color: colors.muted }]}>
          Har du konto? <Text style={[styles.loginLink, { color: colors.accent }]}>Logg inn</Text>
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
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#8B928E',
    textAlign: 'center',
    marginBottom: 28,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionEmoji: { fontSize: 18, fontWeight: '700' },
  optionCopy: { marginLeft: 12, flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardSubtitle: { fontSize: 12, marginTop: 3 },
  continueButton: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  continueDisabled: {
    opacity: 0.4,
  },
  continueText: { fontSize: 15, fontWeight: '700' },
  loginText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
  loginLink: {
    fontWeight: '700',
  },
});
