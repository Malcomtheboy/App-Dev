import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getHadithSections, type HadithSection } from '@/services/hadithApi';
import { useTheme } from '@/theme/theme-context';

export default function HadithCollectionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { collection, name } = useLocalSearchParams<{ collection: string; name?: string }>();

  const [sections, setSections] = useState<HadithSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!collection) return;
    setLoading(true);
    setError('');
    getHadithSections(collection)
      .then(setSections)
      .catch(() => setError('Could not load this collection. Check your connection and try again.'))
      .finally(() => setLoading(false));
  }, [collection]);

  useEffect(() => {
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
  }, [load]);

  const totalHadiths = sections.reduce((sum, s) => sum + s.hadithCount, 0);

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
          <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={1}>{name ?? 'Hadith'}</Text>
          {!loading && !error && (
            <Text style={[s.subtitle, { color: colors.textSecondary }]}>
              {sections.length} chapters · {totalHadiths} hadith
            </Text>
          )}
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[s.loadingText, { color: colors.textSecondary }]}>Loading chapters…</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Ionicons name="cloud-offline-outline" size={32} color={colors.textSecondary} />
          <Text style={[s.errorTitle, { color: colors.textPrimary }]}>Could not load</Text>
          <Text style={[s.errorText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity onPress={load} style={[s.retry, { backgroundColor: colors.accent }]}>
            <Text style={[s.retryText, { color: colors.accentOn }]}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={[s.groupCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
            {sections.map((section, index) => (
              <TouchableOpacity
                key={section.number}
                onPress={() =>
                  router.push({
                    pathname: '/hadith/[collection]/[section]',
                    params: { collection: collection ?? '', section: String(section.number), collectionName: name ?? '' },
                  })
                }
                style={[s.item, index !== sections.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              >
                <View style={[s.numberBadge, { backgroundColor: colors.accentTint }]}>
                  <Text style={[s.numberText, { color: colors.accent }]}>{section.number}</Text>
                </View>
                <View style={s.flex}>
                  <Text style={[s.itemTitle, { color: colors.textPrimary }]} numberOfLines={1}>{section.title}</Text>
                  <Text style={[s.itemSub, { color: colors.textSecondary }]}>{section.hadithCount} hadith</Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16 },
  backButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 },
  loadingText: { fontSize: 14 },
  errorTitle: { fontSize: 17, fontWeight: '700', marginTop: 4 },
  errorText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  retry: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12, marginTop: 6 },
  retryText: { fontWeight: '700' },
  content: { paddingHorizontal: 18, paddingBottom: 40 },
  groupCard: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, shadowOpacity: 1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  item: { minHeight: 62, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 13 },
  numberBadge: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontSize: 12, fontWeight: '700' },
  itemTitle: { fontSize: 14.5, fontWeight: '600' },
  itemSub: { fontSize: 11.5, marginTop: 3 },
});
