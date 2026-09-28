import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-context';

type Level = 'new' | 'beginner' | 'advanced';

const options: { key: Level; icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }[] = [
  { key: 'new', icon: 'sparkles-outline', title: 'New Muslim / revert', subtitle: "I'm new to the faith and want to learn the basics." },
  { key: 'beginner', icon: 'leaf-outline', title: 'Beginner', subtitle: 'I know a little and want to build on it.' },
  { key: 'advanced', icon: 'ribbon-outline', title: 'Advanced', subtitle: 'I want to go deeper.' },
];

export default function OnboardingScreen() {
  const [selected, setSelected] = useState<Level | null>(null);
  const colorScheme = useColorScheme();
  const { colors } = useTheme();

  const handleContinue = async () => {
    if (selected) {
      try {
        await AsyncStorage.setItem('rihla:experienceLevel', selected);
      } catch {
        // Not critical — onboarding still proceeds without it being saved.
      }
    }
    router.replace('/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Image
            accessibilityLabel="Rihla"
            resizeMode="contain"
            source={
              colorScheme === 'dark'
                ? require('@/assets/images/rihla-logo-dark.png')
                : require('@/assets/images/rihla-logo-light.png')
            }
            style={styles.logoImage}
          />
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome to Rihla</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Where does your journey start?</Text>

        {options.map((option) => (
          <TouchableOpacity
            key={option.key}
            accessibilityRole="radio"
            accessibilityState={{ selected: selected === option.key }}
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
              selected === option.key && { backgroundColor: colors.accentTint, borderColor: colors.accent },
            ]}
            onPress={() => setSelected(option.key)}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.accentTint }]}>
              <Ionicons name={option.icon} size={18} color={colors.accent} />
            </View>
            <View style={styles.optionCopy}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{option.title}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{option.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.accent }, !selected && styles.continueDisabled]}
          disabled={!selected}
          onPress={handleContinue}
        >
          <Text style={[styles.continueText, { color: colors.accentOn }]}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/login')}>
          <Text style={[styles.loginText, { color: colors.textSecondary }]}>
            Already have an account? <Text style={[styles.loginLink, { color: colors.accent }]}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 12,
  },
  logoImage: {
    width: 96,
    height: 140,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
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
