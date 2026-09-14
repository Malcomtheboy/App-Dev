import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-context';

type Bookmark = {
  surahId: number;
  surahName: string;
  verseKey: string;
  ayah: number;
  arabic: string;
  translation: string;
  savedAt: number;
};

export default function BookmarksScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const loadBookmarks = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('rihla:bookmarks');
      const data: Bookmark[] = saved ? JSON.parse(saved) : [];
      setBookmarks(data.sort((a, b) => b.savedAt - a.savedAt));
    } catch (e) {
      console.error('Bookmark load error:', e);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadBookmarks();
  }, [loadBookmarks]));

  const openBookmark = (bookmark: Bookmark) => {
    router.push(`/quran/${bookmark.surahId}?ayah=${bookmark.ayah}` as any);
  };

  const removeBookmark = async (verseKey: string) => {
    try {
      const updated = bookmarks.filter(b => b.verseKey !== verseKey);
      setBookmarks(updated);
      await AsyncStorage.setItem('rihla:bookmarks', JSON.stringify(updated));
    } catch (e) {
      console.error('Bookmark delete error:', e);
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[s.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View>
          <Text style={[s.title, { color: colors.textPrimary }]}>Bookmarks</Text>
          <Text style={[s.subtitle, { color: colors.textSecondary }]}>
            {bookmarks.length} saved {bookmarks.length === 1 ? 'ayah' : 'ayahs'}
          </Text>
        </View>
      </View>

      {bookmarks.length === 0 ? (
        <View style={s.empty}>
          <View style={[s.emptyIcon, { backgroundColor: colors.accentTint }]}>
            <Ionicons name="bookmark-outline" size={30} color={colors.accent} />
          </View>

          <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
            No bookmarks yet
          </Text>

          <Text style={[s.emptyText, { color: colors.textSecondary }]}>
            Save an ayah while reading and it will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {bookmarks.map(bookmark => (
            <TouchableOpacity
              key={bookmark.verseKey}
              activeOpacity={0.85}
              onPress={() => openBookmark(bookmark)}
              style={[s.card, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }]}
            >
              <View style={s.cardTop}>
                <View>
                  <Text style={[s.surahName, { color: colors.textPrimary }]}>
                    {bookmark.surahName}
                  </Text>

                  <Text style={[s.ayahLabel, { color: colors.accent }]}>
                    Ayah {bookmark.verseKey}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => removeBookmark(bookmark.verseKey)}
                  hitSlop={10}
                >
                  <Ionicons name="bookmark" size={20} color={colors.accent} />
                </TouchableOpacity>
              </View>

              {!!bookmark.arabic && (
                <Text style={[s.arabic, { color: colors.textPrimary }]}>
                  {bookmark.arabic}
                </Text>
              )}

              {!!bookmark.translation && (
                <Text
                  numberOfLines={3}
                  style={[s.translation, { color: colors.textSecondary }]}
                >
                  {bookmark.translation}
                </Text>
              )}

              <View style={s.openRow}>
                <Text style={[s.openText, { color: colors.accent }]}>
                  Continue reading
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color={colors.accent}
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 16,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 23,
    fontWeight: '700',
  },

  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  content: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },

  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 17,
    marginBottom: 12,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  surahName: {
    fontSize: 16,
    fontWeight: '700',
  },

  ayahLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },

  arabic: {
    fontSize: 24,
    lineHeight: 42,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 16,
  },

  translation: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },

  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 14,
  },

  openText: {
    fontSize: 12,
    fontWeight: '700',
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 7,
  },
});