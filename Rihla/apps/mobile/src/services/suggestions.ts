import type { ExperienceLevel } from './experience-level';

export type ArabicStep = { title: string; href: string; learned: number; total: number };

export type Suggestion = {
  title: string;
  subtitle: string;
  icon: 'language-outline' | 'library-outline' | 'chatbubble-ellipses-outline';
  href: string;
};

// The first Arabic level that still has something left to learn, or null once
// everything is done.
export function nextArabicStep(
  levels: { key: string; title: string; href: string; total: number }[],
  progress: Record<string, number>
): ArabicStep | null {
  for (const level of levels) {
    const learned = progress[level.key] ?? 0;
    if (learned < level.total) return { title: level.title, href: level.href, learned, total: level.total };
  }
  return null;
}

const HADITH: Suggestion = {
  title: 'Explore the 40 Hadith of Nawawi',
  subtitle: 'Short, foundational sayings, a good place to go deeper.',
  icon: 'library-outline',
  href: '/hadith/nawawi',
};

const ASK: Suggestion = {
  title: 'Ask the Rihla Guide',
  subtitle: 'Questions answered with sources you can open.',
  icon: 'chatbubble-ellipses-outline',
  href: '/chat',
};

// One next step, chosen by the experience level picked in onboarding. The
// Continue-reading card already covers resuming the Quran, so this is about
// what to start or grow next, not repeating that.
export function buildSuggestion(level: ExperienceLevel, arabic: ArabicStep | null): Suggestion {
  if (level === 'advanced') return HADITH;

  if (arabic) {
    const started = arabic.learned > 0;
    return {
      title: started ? `Keep going: Arabic ${arabic.title.toLowerCase()}` : level === 'new' ? 'Start with the Arabic alphabet' : `Learn Arabic: ${arabic.title.toLowerCase()}`,
      subtitle: started
        ? `${arabic.learned} of ${arabic.total} learned. A few minutes a day adds up.`
        : level === 'new'
          ? 'The first step to reading the Quran yourself.'
          : 'Build up to reading the Quran yourself.',
      icon: 'language-outline',
      href: arabic.href,
    };
  }

  return level === 'new' ? ASK : HADITH;
}
