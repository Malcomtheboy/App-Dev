import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getHadithSection, type HadithSectionDetail } from '@/services/hadithApi';
import { useTheme } from '@/theme/theme-context';

export default function HadithSectionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { collection, section, collectionName } = useLocalSearchParams<{
    collection: string;
    section: string;
    collectionName?: string;
  }>();

  const [detail, setDetail] = useState<HadithSectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!collection || !section) return;
    setLoading(true);
    setError('');
    getHadithSection(collection, Number(section))
      .then(setDetail)
      .catch(() => setError('Could not load this chapter. Check your connection and try again.'))
      .finally(() => setLoading(false));
  }, [collection, section]);

  useEffect(() => {
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
  }, [load]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[s.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={s.flex}>
          <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={1}>{detail?.title ?? 'Chapter'}</Text>
          <Text style={[s.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {collectionName ?? ''}{detail ? ` · ${detail.hadiths.length} hadith` : ''}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[s.loadingText, { color: colors.textSecondary }]}>Loading hadith…</Text>
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
          {detail?.hadiths.map((hadith) => (
            <View
              key={hadith.hadithnumber}
              style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[s.badge, { backgroundColor: colors.accentTint, borderColor: colors.accent }]}>
                <Text style={{ color: colors.accent, fontWeight: '700' }}>#{hadith.hadithnumber}</Text>
              </View>
              <Text style={[s.text, { color: colors.textPrimary }]}>{hadith.text}</Text>
            </View>
          ))}
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
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 },
  loadingText: { fontSize: 14 },
  errorTitle: { fontSize: 17, fontWeight: '700', marginTop: 4 },
  errorText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  retry: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12, marginTop: 6 },
  retryText: { fontWeight: '700' },
  content: { paddingHorizontal: 18, paddingBottom: 40, gap: 12 },
  card: { borderWidth: 1, borderRadius: 18, padding: 17 },
  badge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12 },
  text: { fontSize: 14.5, lineHeight: 23 },
});
