import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Ionicons } from '@expo/vector-icons';
import { arabicLetters } from '@/data/arabic-letters';
import { arabicSentences } from '@/data/arabic-sentences';
import { arabicWords } from '@/data/arabic-words';
import { harakatList } from '@/data/harakat';

type IconName = keyof typeof Ionicons.glyphMap;

export type ArabicLevel = {
  key: 'letters' | 'harakat' | 'words' | 'sentences';
  title: string;
  subtitle: string;
  icon: IconName;
  href: string;
  total: number;
  storageKey: string;
};

// The four levels, in the order they should be learned.
export const arabicLevels: ArabicLevel[] = [
  {
    key: 'letters',
    title: 'Letters',
    subtitle: 'The 28 letters of the alphabet',
    icon: 'text-outline',
    href: '/arabic/letters',
    total: arabicLetters.length,
    storageKey: 'rihla:learnedArabicLetters',
  },
  {
    key: 'harakat',
    title: 'Harakat',
    subtitle: 'The vowel marks: fatha, kasra, damma, sukun',
    icon: 'ellipsis-horizontal-outline',
    href: '/arabic/harakat',
    total: harakatList.length,
    storageKey: 'rihla:learnedHarakat',
  },
  {
    key: 'words',
    title: 'Words',
    subtitle: 'Joining letters into simple, everyday words',
    icon: 'reader-outline',
    href: '/arabic/words',
    total: arabicWords.length,
    storageKey: 'rihla:learnedArabicWords',
  },
  {
    key: 'sentences',
    title: 'Sentences',
    subtitle: '"This is a ___" — reading short phrases',
    icon: 'chatbox-outline',
    href: '/arabic/sentences',
    total: arabicSentences.length,
    storageKey: 'rihla:learnedArabicSentences',
  },
];

// How many items are marked learned in each level.
export async function getArabicProgress(): Promise<Record<string, number>> {
  const entries = await Promise.all(
    arabicLevels.map((level) =>
      AsyncStorage.getItem(level.storageKey)
        .then((saved) => [level.key, saved ? (JSON.parse(saved) as number[]).length : 0] as const)
        .catch(() => [level.key, 0] as const)
    )
  );
  return Object.fromEntries(entries);
}
