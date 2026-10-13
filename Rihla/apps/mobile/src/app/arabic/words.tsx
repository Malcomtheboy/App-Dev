import AsyncStorage from '@react-native-async-storage/async-storage';
import { recordActivity } from '@/services/progress-stats';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Sheet } from '@/components/sheet';
import { arabicWords, type ArabicWord } from '@/data/arabic-words';
import { useTheme } from '@/theme/theme-context';

const STORAGE_KEY = 'rihla:learnedArabicWords';

export default function WordsScreen() {
  const { colors } = useTheme();
  const [learned, setLearned] = useState<number[]>([]);
  const [active, setActive] = useState<ArabicWord | null>(null);

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
      if (!prev.includes(id)) void recordActivity();
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
          <Text style={[s.title, { color: colors.textPrimary }]}>Words</Text>
          <Text style={[s.subtitle, { color: colors.textSecondary }]}>{learned.length} / {arabicWords.length} learned</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/arabic/words-practice' as any)}
          style={[s.practiceButton, { backgroundColor: colors.accent }]}
        >
          <Ionicons name="shuffle-outline" size={16} color={colors.accentOn} />
          <Text style={[s.practiceButtonText, { color: colors.accentOn }]}>Practice</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={[s.intro, { color: colors.textSecondary }]}>
          Now the letters and marks join into real words. Tap one to see it broken down letter by letter.
        </Text>

        <View style={[s.groupCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
          {arabicWords.map((item, index) => {
            const done = isLearned(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setActive(item)}
                style={[s.row, index !== arabicWords.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              >
                <View style={[s.wordBadge, { backgroundColor: done ? colors.accentTint : colors.iconCircle, borderColor: done ? colors.accent : colors.iconBorder }]}>
                  <Text style={[s.wordGlyph, { color: done ? colors.accent : colors.textPrimary }]}>{item.word}</Text>
                </View>
                <View style={s.flex}>
                  <Text style={[s.rowTitle, { color: colors.textPrimary }]}>{item.meaning}</Text>
                  <Text style={[s.rowSub, { color: colors.textSecondary }]}>{item.transliteration}</Text>
                </View>
                {done && <Ionicons name="checkmark-circle" size={18} color={colors.accent} />}
                <Ionicons name="chevron-forward" size={17} color={colors.textTertiary} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Sheet visible={!!active} onClose={() => setActive(null)} title={active?.meaning ?? ''}>
        {active && (
          <>
            <Text style={[s.sheetWord, { color: colors.textPrimary }]}>{active.word}</Text>
            <Text style={[s.sheetTransliteration, { color: colors.textSecondary }]}>{active.transliteration}</Text>

            <Text style={[s.formsLabel, { color: colors.textTertiary }]}>SOUND IT OUT</Text>
            <View style={s.partsRow}>
              {active.parts.map((part, i) => (
                <View key={i} style={[s.partCard, { backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
                  <Text style={[s.partGlyph, { color: colors.textPrimary }]}>{part}</Text>
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
  groupCard: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, shadowOpacity: 1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  row: { minHeight: 66, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 13 },
  wordBadge: { minWidth: 54, height: 44, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  wordGlyph: { fontSize: 18, fontWeight: '600' },
  rowTitle: { fontSize: 14.5, fontWeight: '600', textTransform: 'capitalize' },
  rowSub: { fontSize: 11.5, marginTop: 3 },
  sheetWord: { fontSize: 52, fontWeight: '600', textAlign: 'center' },
  sheetTransliteration: { fontSize: 14, textAlign: 'center', marginTop: 6, marginBottom: 22, fontStyle: 'italic' },
  formsLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  partsRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  partCard: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  partGlyph: { fontSize: 24 },
  learnButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 16 },
  learnButtonText: { fontSize: 14, fontWeight: '700' },
});
