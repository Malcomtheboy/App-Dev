import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { arabicWords, type ArabicWord } from '@/data/arabic-words';
import { useTheme } from '@/theme/theme-context';

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type Question = { word: ArabicWord; options: string[] };

function buildQuestions(): Question[] {
  return shuffle(arabicWords).map((word) => {
    const distractors = shuffle(arabicWords.filter((w) => w.id !== word.id))
      .slice(0, 3)
      .map((w) => w.meaning);
    return { word, options: shuffle([word.meaning, ...distractors]) };
  });
}

export default function WordsPracticeScreen() {
  const { colors } = useTheme();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const start = () => {
    setQuestions(buildQuestions());
    setIndex(0);
    setCorrectCount(0);
    setPicked(null);
  };

  const current = questions?.[index] ?? null;
  const finished = questions !== null && index >= questions.length;

  const choose = (option: string) => {
    if (picked || !current) return;
    setPicked(option);
    const isCorrect = option === current.word.meaning;
    if (isCorrect) setCorrectCount((c) => c + 1);
    setTimeout(() => {
      setPicked(null);
      setIndex((i) => i + 1);
    }, 700);
  };

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
          <Text style={[s.title, { color: colors.textPrimary }]}>Match the word</Text>
          {questions && !finished && (
            <Text style={[s.subtitle, { color: colors.textSecondary }]}>
              Question {index + 1} of {questions.length}
            </Text>
          )}
        </View>
      </View>

      <View style={s.body}>
        {!questions ? (
          <View style={s.center}>
            <View style={[s.introIcon, { backgroundColor: colors.accentTint }]}>
              <Ionicons name="shuffle-outline" size={26} color={colors.accent} />
            </View>
            <Text style={[s.introTitle, { color: colors.textPrimary }]}>Match the word to its meaning</Text>
            <Text style={[s.introText, { color: colors.textSecondary }]}>
              You&apos;ll see a word and pick what it means from four options.
            </Text>
            <TouchableOpacity onPress={start} style={[s.startButton, { backgroundColor: colors.accent }]}>
              <Text style={[s.startButtonText, { color: colors.accentOn }]}>Start</Text>
            </TouchableOpacity>
          </View>
        ) : finished ? (
          <View style={s.center}>
            <View style={[s.introIcon, { backgroundColor: colors.accentTint }]}>
              <Ionicons name="ribbon-outline" size={26} color={colors.accent} />
            </View>
            <Text style={[s.introTitle, { color: colors.textPrimary }]}>
              {correctCount} / {questions.length} correct
            </Text>
            <Text style={[s.introText, { color: colors.textSecondary }]}>
              {correctCount === questions.length
                ? 'Perfect score. These words are yours now.'
                : 'Nice work. Practice again to lock in the ones you missed.'}
            </Text>
            <TouchableOpacity onPress={start} style={[s.startButton, { backgroundColor: colors.accent }]}>
              <Text style={[s.startButtonText, { color: colors.accentOn }]}>Practice again</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} style={s.doneButton}>
              <Text style={[s.doneButtonText, { color: colors.textSecondary }]}>Back to words</Text>
            </TouchableOpacity>
          </View>
        ) : (
          current && (
            <>
              <View style={[s.letterCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
                <Text style={[s.letterGlyph, { color: colors.textPrimary }]}>{current.word.word}</Text>
                <Text style={[s.letterTransliteration, { color: colors.textSecondary }]}>{current.word.transliteration}</Text>
              </View>

              <View style={s.options}>
                {current.options.map((option) => {
                  const isPicked = picked === option;
                  const isCorrectOption = option === current.word.meaning;
                  const showState = !!picked && (isPicked || isCorrectOption);
                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => choose(option)}
                      disabled={!!picked}
                      style={[
                        s.option,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        showState && isCorrectOption && { backgroundColor: colors.accentTint, borderColor: colors.accent },
                        showState && isPicked && !isCorrectOption && { backgroundColor: 'rgba(229,72,77,0.12)', borderColor: colors.negative },
                      ]}
                    >
                      <Text style={[s.optionText, { color: colors.textPrimary, textTransform: 'capitalize' }]}>{option}</Text>
                      {showState && isCorrectOption && <Ionicons name="checkmark-circle" size={18} color={colors.accent} />}
                      {showState && isPicked && !isCorrectOption && <Ionicons name="close-circle" size={18} color={colors.negative} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  body: { flex: 1, paddingHorizontal: 18, paddingBottom: 110 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  introIcon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  introTitle: { fontSize: 19, fontWeight: '700', textAlign: 'center' },
  introText: { fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 280 },
  startButton: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, marginTop: 12 },
  startButtonText: { fontSize: 15, fontWeight: '700' },
  doneButton: { marginTop: 6, padding: 8 },
  doneButtonText: { fontSize: 13, fontWeight: '600' },
  letterCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 20,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  letterGlyph: { fontSize: 64, fontWeight: '600' },
  letterTransliteration: { fontSize: 15, fontStyle: 'italic' },
  options: { gap: 10, paddingBottom: 10 },
  option: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  optionText: { fontSize: 15, fontWeight: '600' },
});
