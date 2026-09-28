import type { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

export const starterPrompts: { title: string; icon: IconName }[] = [
  { title: 'How do I make wudu?', icon: 'water-outline' },
  { title: 'What breaks the fast?', icon: 'moon-outline' },
  { title: 'Meaning of Surah Al-Ikhlas', icon: 'book-outline' },
  { title: 'Best time for Duha prayer', icon: 'time-outline' },
];
