import type { Ionicons } from '@expo/vector-icons';
import type { ExperienceLevel } from './experience-level';

type IconName = keyof typeof Ionicons.glyphMap;
export type Starter = { title: string; icon: IconName };

const startersByLevel: Record<ExperienceLevel, Starter[]> = {
  new: [
    { title: 'How do I pray, step by step?', icon: 'time-outline' },
    { title: 'What are the five pillars of Islam?', icon: 'ribbon-outline' },
    { title: 'How do I make wudu?', icon: 'water-outline' },
    { title: 'What is Surah Al-Fatihah about?', icon: 'book-outline' },
  ],
  beginner: [
    { title: 'How do I make wudu?', icon: 'water-outline' },
    { title: 'What breaks the fast?', icon: 'moon-outline' },
    { title: 'Meaning of Surah Al-Ikhlas', icon: 'book-outline' },
    { title: 'Best time for Duha prayer', icon: 'time-outline' },
  ],
  advanced: [
    { title: 'How are hadith graded as sahih or hasan?', icon: 'library-outline' },
    { title: 'What is the difference between tafsir and ta’wil?', icon: 'book-outline' },
    { title: 'Why do the madhhabs differ on some rulings?', icon: 'git-compare-outline' },
    { title: 'Explain the first hadith of Nawawi', icon: 'ribbon-outline' },
  ],
};

export function startersFor(level: ExperienceLevel): Starter[] {
  return startersByLevel[level];
}
