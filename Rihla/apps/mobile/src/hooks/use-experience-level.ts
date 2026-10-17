import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { loadExperienceLevel, saveExperienceLevel, type ExperienceLevel } from '@/services/experience-level';

// The level picked in onboarding, which shapes what Home suggests, how the
// Learn tab is ordered, the Ask starters, and how the AI words its answers.
export function useExperienceLevel() {
  const [level, setLevelState] = useState<ExperienceLevel>('beginner');

  const reload = useCallback(() => {
    loadExperienceLevel().then(setLevelState);
  }, []);
  useFocusEffect(reload);

  const setLevel = useCallback((next: ExperienceLevel) => {
    setLevelState(next);
    void saveExperienceLevel(next);
  }, []);

  return { level, setLevel };
}
