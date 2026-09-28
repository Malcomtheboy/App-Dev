export type ArabicWord = {
  id: number;
  word: string;
  // Each part is one letter in its isolated form with the vowel mark it
  // carries inside the word, for "sounding it out" — the joined word above
  // uses connected letterforms, same as any normal Arabic text.
  parts: string[];
  transliteration: string;
  meaning: string;
};

// Simple, common nouns built only from the four harakat already taught (no
// tanween, no shadda, no long vowels) — the same short-word stage every
// beginner primer moves to right after harakat.
export const arabicWords: ArabicWord[] = [
  { id: 1, word: 'بَيْت', parts: ['بَ', 'يْ', 'ت'], transliteration: 'bayt', meaning: 'house' },
  { id: 2, word: 'قَلَم', parts: ['قَ', 'لَ', 'م'], transliteration: 'qalam', meaning: 'pen' },
  { id: 3, word: 'كَلْب', parts: ['كَ', 'لْ', 'ب'], transliteration: 'kalb', meaning: 'dog' },
  { id: 4, word: 'شَمْس', parts: ['شَ', 'مْ', 'س'], transliteration: 'shams', meaning: 'sun' },
  { id: 5, word: 'نَجْم', parts: ['نَ', 'جْ', 'م'], transliteration: 'najm', meaning: 'star' },
  { id: 6, word: 'جَبَل', parts: ['جَ', 'بَ', 'ل'], transliteration: 'jabal', meaning: 'mountain' },
  { id: 7, word: 'قَمَر', parts: ['قَ', 'مَ', 'ر'], transliteration: 'qamar', meaning: 'moon' },
  { id: 8, word: 'سَمَك', parts: ['سَ', 'مَ', 'ك'], transliteration: 'samak', meaning: 'fish' },
  { id: 9, word: 'عِلْم', parts: ['عِ', 'لْ', 'م'], transliteration: 'ilm', meaning: 'knowledge' },
  { id: 10, word: 'رَجُل', parts: ['رَ', 'جُ', 'ل'], transliteration: 'rajul', meaning: 'man' },
  { id: 11, word: 'وَجْه', parts: ['وَ', 'جْ', 'ه'], transliteration: 'wajh', meaning: 'face' },
  { id: 12, word: 'يَد', parts: ['يَ', 'د'], transliteration: 'yad', meaning: 'hand' },
];
