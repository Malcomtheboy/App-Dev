import AsyncStorage from '@react-native-async-storage/async-storage';

export type ExperienceLevel = 'new' | 'beginner' | 'advanced';

// Same key the onboarding screen writes to.
export const LEVEL_KEY = 'rihla:experienceLevel';

export const levelOptions: { key: ExperienceLevel; title: string; subtitle: string }[] = [
  { key: 'new', title: 'New Muslim / revert', subtitle: "I'm new to the faith and want to learn the basics." },
  { key: 'beginner', title: 'Beginner', subtitle: 'I know a little and want to build on it.' },
  { key: 'advanced', title: 'Advanced', subtitle: 'I want to go deeper.' },
];

export function parseExperienceLevel(value: string | null): ExperienceLevel {
  return value === 'new' || value === 'advanced' || value === 'beginner' ? value : 'beginner';
}

export async function loadExperienceLevel(): Promise<ExperienceLevel> {
  try {
    return parseExperienceLevel(await AsyncStorage.getItem(LEVEL_KEY));
  } catch {
    return 'beginner';
  }
}

export async function saveExperienceLevel(level: ExperienceLevel): Promise<void> {
  try {
    await AsyncStorage.setItem(LEVEL_KEY, level);
  } catch {
    // Best-effort — the choice just won't survive a restart.
  }
}
