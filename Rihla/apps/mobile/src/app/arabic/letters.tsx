import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Sheet } from '@/components/sheet';
import { arabicLetters, type ArabicLetter } from '@/data/arabic-letters';
import { useTheme } from '@/theme/theme-context';

const STORAGE_KEY = 'rihla:learnedArabicLetters';

export default function ArabicLettersScreen() {
  const { colors } = useTheme();
  const [learned, setLearned] = useState<number[]>([]);
  const [active, setActive] = useState<ArabicLetter | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved) setLearned(JSON.parse(saved));
      })
      .catch(() => {
        // No saved progress yet — start from an empty list.
      });
  }, []);

  const toggleLearned = (id: number) => {
    setLearned((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const isLearned = (id: number) => learned.includes(id);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[s.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.flex}>
          <Text style={[s.title, { color: colors.textPrimary }]}>Arabic letters</Text>
          <Text style={[s.subtitle, { color: colors.textSecondary }]}>{learned.length} / {arabicLetters.length} learned</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/arabic/letters-practice' as any)}
          style={[s.practiceButton, { backgroundColor: colors.accent }]}
        >
          <Ionicons name="shuffle-outline" size={16} color={colors.accentOn} />
          <Text style={[s.practiceButtonText, { color: colors.accentOn }]}>Practice</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={[s.intro, { color: colors.textSecondary }]}>
          Tap a letter to see how it&apos;s written and pronounced. Mark it as learned once it feels familiar.
        </Text>

        <View style={s.grid}>
          {arabicLetters.map((letter) => {
            const done = isLearned(letter.id);
            return (
              <TouchableOpacity
                key={letter.id}
                onPress={() => setActive(letter)}
                style={[
                  s.tile,
                  { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow },
                  done && { borderColor: colors.accent, backgroundColor: colors.accentTint },
                ]}
              >
                {done && (
                  <View style={[s.check, { backgroundColor: colors.accent }]}>
                    <Ionicons name="checkmark" size={10} color={colors.accentOn} />
                  </View>
                )}
                <Text style={[s.tileLetter, { color: colors.textPrimary }]}>{letter.isolated}</Text>
                <Text style={[s.tileName, { color: colors.textSecondary }]}>{letter.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Sheet visible={!!active} onClose={() => setActive(null)} title={active?.name ?? ''}>
        {active && (
          <>
            <Text style={[s.sheetLetter, { color: colors.textPrimary }]}>{active.isolated}</Text>
            <Text style={[s.sheetPronunciation, { color: colors.textSecondary }]}>{active.pronunciation}</Text>

            <Text style={[s.formsLabel, { color: colors.textTertiary }]}>WRITTEN FORMS</Text>
            <View style={s.formsRow}>
              {(
                [
                  ['Isolated', active.isolated],
                  ['Initial', active.initial],
                  ['Medial', active.medial],
                  ['Final', active.final],
                ] as const
              ).map(([label, glyph]) => (
                <View key={label} style={[s.formCard, { backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
                  <Text style={[s.formGlyph, { color: colors.textPrimary }]}>{glyph}</Text>
                  <Text style={[s.formLabel, { color: colors.textSecondary }]}>{label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => toggleLearned(active.id)}
              style={[
                s.learnButton,
                { backgroundColor: isLearned(active.id) ? colors.accentTint : colors.accent, borderColor: colors.accent, borderWidth: isLearned(active.id) ? 1 : 0 },
              ]}
            >
              <Ionicons
                name={isLearned(active.id) ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={18}
                color={isLearned(active.id) ? colors.accent : colors.accentOn}
              />
              <Text style={[s.learnButtonText, { color: isLearned(active.id) ? colors.accent : colors.accentOn }]}>
                {isLearned(active.id) ? 'Learned' : 'Mark as learned'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </Sheet>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  practiceButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  practiceButtonText: { fontSize: 12.5, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  content: { paddingHorizontal: 18, paddingBottom: 130 },
  intro: { fontSize: 13, lineHeight: 19, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '22%',
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  check: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tileLetter: { fontSize: 26, fontWeight: '600' },
  tileName: { fontSize: 9.5, fontWeight: '600' },
  sheetLetter: { fontSize: 64, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  sheetPronunciation: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  formsLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  formsRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  formCard: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 8 },
  formGlyph: { fontSize: 22 },
  formLabel: { fontSize: 10, fontWeight: '600' },
  learnButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 16 },
  learnButtonText: { fontSize: 14, fontWeight: '700' },
});
