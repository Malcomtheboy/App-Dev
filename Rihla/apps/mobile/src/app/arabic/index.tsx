import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { arabicLevels as levels, getArabicProgress } from '@/services/arabic-progress';
import { useTheme } from '@/theme/theme-context';

export default function ArabicHubScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [progress, setProgress] = useState<Record<string, number>>({});

  const loadProgress = useCallback(() => {
    getArabicProgress().then(setProgress);
  }, []);

  useFocusEffect(loadProgress);

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
          <Text style={[s.title, { color: colors.textPrimary }]}>Learn Arabic</Text>
          <Text style={[s.subtitle, { color: colors.textSecondary }]}>Reading the Quran, one step at a time</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {levels.map((level, index) => {
          const done = progress[level.key] ?? 0;
          return (
            <TouchableOpacity
              key={level.key}
              onPress={() => router.push(level.href as any)}
              style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}
            >
              <View style={[s.levelBadge, { backgroundColor: colors.accentTint }]}>
                <Text style={[s.levelBadgeText, { color: colors.accent }]}>{index + 1}</Text>
              </View>
              <View style={[s.icon, { backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
                <Ionicons name={level.icon} size={19} color={colors.textSecondary} />
              </View>
              <View style={s.flex}>
                <Text style={[s.cardTitle, { color: colors.textPrimary }]}>{level.title}</Text>
                <Text style={[s.cardSubtitle, { color: colors.textSecondary }]}>{level.subtitle}</Text>
                <Text style={[s.cardProgress, { color: colors.accent }]}>{done} / {level.total} learned</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  content: { paddingHorizontal: 18, paddingBottom: 130, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  levelBadge: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  levelBadgeText: { fontSize: 12, fontWeight: '700' },
  icon: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardSubtitle: { fontSize: 12, marginTop: 3, lineHeight: 17 },
  cardProgress: { fontSize: 11, fontWeight: '700', marginTop: 6 },
});
