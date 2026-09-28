export type Harakat = {
  id: number;
  mark: string;
  name: string;
  sound: string;
  // The mark rendered on a handful of different base letters, to show it
  // attaches the same way to any letter.
  examples: string[];
};

// The four essential vowel marks taught before moving on to words — the same
// starting point used by traditional Quran-reading primers (Noorani Qaida).
// Tanwin and shadda are a natural follow-up once these are solid.
export const harakatList: Harakat[] = [
  {
    id: 1,
    mark: 'َ',
    name: 'Fatha',
    sound: 'A short "a" sound, as in "cat". Sits above the letter.',
    examples: ['بَ', 'تَ', 'جَ', 'مَ'],
  },
  {
    id: 2,
    mark: 'ِ',
    name: 'Kasra',
    sound: 'A short "i" sound, as in "sit". Sits below the letter.',
    examples: ['بِ', 'تِ', 'جِ', 'مِ'],
  },
  {
    id: 3,
    mark: 'ُ',
    name: 'Damma',
    sound: 'A short "u" sound, as in "put". Sits above the letter.',
    examples: ['بُ', 'تُ', 'جُ', 'مُ'],
  },
  {
    id: 4,
    mark: 'ْ',
    name: 'Sukun',
    sound: 'No vowel at all — just the bare consonant sound, cut short.',
    examples: ['بْ', 'تْ', 'جْ', 'مْ'],
  },
];
