import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { juzStarts } from '@/data/juz-starts';
import { useExperienceLevel } from '@/hooks/use-experience-level';
import { getQuranChapters } from '@/services/quranApi';
import { useTheme } from '@/theme/theme-context';

type IconName = keyof typeof Ionicons.glyphMap;
type Chapter = { id: number; nameSimple: string; nameArabic: string; versesCount: number };
type LastRead = { surahId: number; surahName: string; verseKey: string; ayah: number; updatedAt: number };

const collections: { key: string; title: string; subtitle: string; icon: IconName }[] = [
  { key: 'bukhari', title: 'Sahih al-Bukhari', subtitle: '7,563 hadith', icon: 'library-outline' },
  { key: 'muslim', title: 'Sahih Muslim', subtitle: '7,563 hadith', icon: 'bookmarks-outline' },
  { key: 'nawawi', title: '40 Hadith Nawawi', subtitle: '42 hadith', icon: 'ribbon-outline' },
];

export default function LearnScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const { level } = useExperienceLevel();

  const [tab, setTab] = useState<'quran' | 'hadith'>('quran');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [search, setSearch] = useState('');
  const [juz, setJuz] = useState<number | null>(null);
  const [juzOpen, setJuzOpen] = useState(false);

  // Adjust state during render when an incoming search query changes, rather than in an
  // effect — this is React's recommended pattern for syncing state from a changing prop.
  const [handledQuery, setHandledQuery] = useState<string | undefined>(undefined);
  if (q !== handledQuery) {
    setHandledQuery(q);
    if (typeof q === 'string' && q.length > 0) {
      setTab('quran');
      setSearch(q);
    }
  }

  useEffect(() => {
    getQuranChapters()
      .then(data => {
        setChapters(data);
      })
      .catch(e => console.error('Quran API:', e));
  }, []);

  const loadLastRead = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('rihla:lastRead');
      setLastRead(saved ? JSON.parse(saved) : null);
    } catch (e) {
      console.error('Last Read:', e);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadLastRead(); }, [loadLastRead]));

  const continueSurah = lastRead?.surahId ?? 1;
  const continueAyah = lastRead?.ayah ?? 1;
  const total = chapters.find(c => c.id === continueSurah)?.versesCount ?? continueAyah;
  const progress = Math.min(Math.max((continueAyah / total) * 100, 5), 100);

  const visibleChapters = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (q) {
      return chapters.filter(c =>
        c.nameSimple.toLowerCase().includes(q) ||
        c.nameArabic.includes(search.trim()) ||
        String(c.id).includes(q)
      );
    }

    if (juz) {
      const start = juzStarts[juz - 1][0];
      const end = juz === 30 ? 114 : juzStarts[juz][0];
      return chapters.filter(c => c.id >= start && c.id <= end);
    }

    return chapters;
  }, [chapters, juz, search]);

  const changeJuz = (dir: number) => {
    const next = Math.min(30, Math.max(1, (juz ?? 1) + dir));
    setJuz(next);
    setJuzOpen(false);
  };

  // New Muslims see the alphabet first; everyone else finds it after Bookmarks.
  const arabicCard = (
    <TouchableOpacity
      onPress={() => router.push('/arabic' as any)}
      style={[s.bookmark, {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        ...(level === 'new' && { marginTop: 0, marginBottom: 20 }),
      }]}
    >
      <View style={s.bookmarkLeft}>
        <View style={[s.bookmarkIcon, { backgroundColor: colors.accentTint }]}>
          <Text style={[s.bookmarkArabic, { color: colors.accent }]}>ا</Text>
        </View>

        <View>
          <Text style={[s.bookmarkTitle, { color: colors.textPrimary }]}>
            Learn Arabic
          </Text>
          <Text style={[s.bookmarkSub, { color: colors.textSecondary }]}>
            {level === 'new' ? 'Start here: the alphabet, step by step' : 'Letters, vowel marks and reading'}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={[s.heading, { color: colors.textPrimary }]}>Quran & Hadith</Text>
        <Text style={[s.intro, { color: colors.textSecondary }]}>
          A quiet place to learn, reflect and return.
        </Text>

        <View style={[s.tabs, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {(['quran', 'hadith'] as const).map(x => (
            <TouchableOpacity
              key={x}
              onPress={() => { setTab(x); setSearch(''); }}
              style={[s.tab, tab === x && { backgroundColor: colors.accent }]}
            >
              <Ionicons
                name={x === 'quran' ? 'book-outline' : 'library-outline'}
                size={17}
                color={tab === x ? '#FFF' : colors.textSecondary}
              />
              <Text style={[s.tabText, { color: tab === x ? '#FFF' : colors.textSecondary }]}>
                {x === 'quran' ? 'Quran' : 'Hadith'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[s.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={19} color={colors.textTertiary} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={tab === 'quran' ? 'Search Surah or number' : 'Search Hadith'}
            placeholderTextColor={colors.textTertiary}
            style={[s.input, { color: colors.textPrimary }, { outlineStyle: 'none' } as any]}
          />

          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {tab === 'quran' ? (
          <>
            {!search && (
              <>
                {level === 'new' && arabicCard}
                <Text style={[s.overline, { color: colors.textTertiary }]}>CONTINUE READING</Text>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push(`/quran/${continueSurah}?ayah=${continueAyah}` as any)
                  }
                >
                  <LinearGradient
                    colors={colors.heroGradient as [string, string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[s.continueCard, { shadowColor: colors.heroShadow }]}
                  >
                    <Ionicons
                      name="moon-outline"
                      size={60}
                      color="rgba(255,255,255,0.07)"
                      style={s.emblem}
                    />

                    <View style={s.continueIcon}>
                      <Ionicons name="book-outline" size={21} color="#FFF" />
                    </View>

                    <View style={s.copy}>
                      <Text style={s.continueTitle}>
                        {lastRead?.surahName ?? 'Al-Fatihah'}
                      </Text>

                      <Text style={s.continueSub}>
                        Continue from Ayah {continueAyah}
                      </Text>

                      <View style={s.progressTrack}>
                        <View style={[s.progressFill, { width: `${progress}%` as any }]} />
                      </View>
                    </View>

                    <View style={s.continueArrow}>
                      <Ionicons name="arrow-forward" size={17} color="#FFF" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={s.juzTop}>
                  <Text style={[s.overline, { color: colors.textTertiary, marginBottom: 0 }]}>
                    BROWSE BY JUZ
                  </Text>

                  {!!juz && (
                    <TouchableOpacity onPress={() => { setJuz(null); setJuzOpen(false); }}>
                      <Text style={[s.allText, { color: colors.accent }]}>All Surahs</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={[s.juzSelector, {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }]}>
                  <TouchableOpacity style={s.juzArrow} onPress={() => changeJuz(-1)}>
                    <Ionicons
                      name="chevron-back"
                      size={19}
                      color={juz === 1 ? colors.textTertiary : colors.textPrimary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={s.juzCenter}
                    onPress={() => setJuzOpen(v => !v)}
                  >
                    <View>
                      <Text style={[s.juzMain, { color: colors.textPrimary }]}>
                        {juz ? `Juz ${juz}` : 'All Juz'}
                      </Text>
                      <Text style={[s.juzSub, { color: colors.textSecondary }]}>
                        {juz ? 'Showing Surahs in this Juz' : 'Select one of 30 Juz'}
                      </Text>
                    </View>

                    <Ionicons
                      name={juzOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity style={s.juzArrow} onPress={() => changeJuz(1)}>
                    <Ionicons
                      name="chevron-forward"
                      size={19}
                      color={juz === 30 ? colors.textTertiary : colors.textPrimary}
                    />
                  </TouchableOpacity>
                </View>

                {juzOpen && (
                  <View style={[s.juzGrid, {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }]}>
                    {juzStarts.map((_, i) => {
                      const n = i + 1;
                      const active = juz === n;

                      return (
                        <TouchableOpacity
                          key={n}
                          onPress={() => { setJuz(n); setJuzOpen(false); }}
                          style={[
                            s.juzChip,
                            { borderColor: colors.border },
                            active && {
                              backgroundColor: colors.accent,
                              borderColor: colors.accent,
                            },
                          ]}
                        >
                          <Text style={[
                            s.juzChipText,
                            { color: active ? '#FFF' : colors.textSecondary },
                          ]}>
                            {n}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => router.push('/quran/bookmarks' as any)}
                  style={[s.bookmark, {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }]}
                >
                  <View style={s.bookmarkLeft}>
                    <View style={[s.bookmarkIcon, { backgroundColor: colors.accentTint }]}>
                      <Ionicons name="bookmark" size={18} color={colors.accent} />
                    </View>

                    <View>
                      <Text style={[s.bookmarkTitle, { color: colors.textPrimary }]}>
                        Bookmarks
                      </Text>
                      <Text style={[s.bookmarkSub, { color: colors.textSecondary }]}>
                        Your saved ayahs
                      </Text>
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>

                {level !== 'new' && arabicCard}
              </>
            )}

            <View style={s.surahHead}>
              <Text style={[s.sectionTitle, { color: colors.textPrimary, marginVertical: 0 }]}>
                {search ? 'Search results' : juz ? `Surahs · Juz ${juz}` : 'Surahs'}
              </Text>

              {!!juz && !search && (
                <View style={[s.badge, { backgroundColor: colors.accentTint }]}>
                  <Text style={[s.badgeText, { color: colors.accent }]}>Juz {juz}</Text>
                </View>
              )}
            </View>

            {visibleChapters.length ? (
              <View style={[s.groupCard, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.cardShadow,
              }]}>
                {visibleChapters.map((c, i) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => router.push(`/quran/${c.id}`)}
                    style={[
                      s.item,
                      i < visibleChapters.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <View style={[s.surahNumber, { backgroundColor: colors.accentTint }]}>
                      <Text style={[s.surahNumberText, { color: colors.accent }]}>
                        {c.id}
                      </Text>
                    </View>

                    <View style={s.copy}>
                      <Text style={[s.title, { color: colors.textPrimary }]}>
                        {c.nameSimple}
                      </Text>
                      <Text style={[s.sub, { color: colors.textSecondary }]}>
                        {c.versesCount} verses
                      </Text>
                    </View>

                    <Text style={[s.arabicName, { color: colors.textPrimary }]}>
                      {c.nameArabic}
                    </Text>

                    <Ionicons name="chevron-forward" size={17} color={colors.textTertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={s.empty}>
                <Ionicons name="search-outline" size={26} color={colors.textTertiary} />
                <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
                  No Surahs found
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
              Hadith collections
            </Text>

            <View style={[s.groupCard, {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.cardShadow,
            }]}>
              {collections.map((c, i) => (
                <TouchableOpacity
                  key={c.title}
                  onPress={() =>
                    router.push({ pathname: '/hadith/[collection]', params: { collection: c.key, name: c.title } })
                  }
                  style={[
                    s.item,
                    i < collections.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={[s.itemIcon, {
                    backgroundColor: colors.iconCircle,
                    borderColor: colors.iconBorder,
                  }]}>
                    <Ionicons name={c.icon} size={18} color={colors.textSecondary} />
                  </View>

                  <View style={s.copy}>
                    <Text style={[s.title, { color: colors.textPrimary }]}>{c.title}</Text>
                    <Text style={[s.sub, { color: colors.textSecondary }]}>{c.subtitle}</Text>
                  </View>

                  <Ionicons name="chevron-forward" size={17} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {!search && (
          <>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
              Daily reflection
            </Text>

            <View style={[s.reflection, {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.cardShadow,
            }]}>
              <View style={[s.reflectionIcon, { backgroundColor: colors.accentTint }]}>
                <Ionicons name="sunny-outline" size={18} color={colors.accent} />
              </View>

              <Text style={[s.quote, { color: colors.textPrimary }]}>
                “Indeed, with hardship comes ease.”
              </Text>

              <Text style={[s.source, { color: colors.textSecondary }]}>
                Surah Ash-Sharh, 94:6
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 130 },

  heading: { fontSize: 27, fontWeight: '700', letterSpacing: -0.6 },
  intro: { fontSize: 14, marginTop: 7, marginBottom: 18 },

  tabs: { flexDirection: 'row', borderWidth: 1, borderRadius: 16, padding: 4, marginBottom: 16 },
  tab: { flex: 1, height: 40, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  tabText: { fontSize: 13, fontWeight: '700' },

  search: { height: 50, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 },
  input: { flex: 1, fontSize: 14 },

  overline: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 27, marginBottom: 10 },

  continueCard: { borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 13, overflow: 'hidden', shadowOpacity: 1, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 6 },
  emblem: { position: 'absolute', top: -8, right: -4 },
  continueIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.16)' },
  continueTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  continueSub: { color: 'rgba(255,255,255,.72)', fontSize: 11.5, marginTop: 4 },
  progressTrack: { height: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.18)', marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFF' },
  continueArrow: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.16)' },

  juzTop: { marginTop: 27, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  allText: { fontSize: 11, fontWeight: '700' },

  juzSelector: { height: 58, borderWidth: 1, borderRadius: 17, flexDirection: 'row', alignItems: 'center' },
  juzArrow: { width: 45, height: '100%', alignItems: 'center', justifyContent: 'center' },
  juzCenter: { flex: 1, height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  juzMain: { fontSize: 14, fontWeight: '700' },
  juzSub: { fontSize: 10, marginTop: 2 },

  juzGrid: { borderWidth: 1, borderRadius: 16, marginTop: 7, padding: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  juzChip: { width: 32, height: 30, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  juzChipText: { fontSize: 11, fontWeight: '700' },

  bookmark: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  bookmarkLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bookmarkIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  bookmarkArabic: { fontSize: 20, fontWeight: '700' },
  bookmarkTitle: { fontSize: 14, fontWeight: '700' },
  bookmarkSub: { fontSize: 11.5, marginTop: 3 },

  surahHead: { marginTop: 30, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, marginTop: 30, marginBottom: 12 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 10, fontWeight: '700' },

  groupCard: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, shadowOpacity: 1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  item: { minHeight: 64, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 13 },
  itemIcon: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  surahNumber: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  surahNumberText: { fontSize: 12, fontWeight: '700' },

  copy: { flex: 1 },
  title: { fontSize: 14.5, fontWeight: '600' },
  sub: { fontSize: 11.5, marginTop: 4 },
  arabicName: { fontSize: 18 },

  empty: { alignItems: 'center', paddingVertical: 45 },
  emptyTitle: { fontSize: 14, fontWeight: '700', marginTop: 8 },

  reflection: { borderWidth: 1, borderRadius: 20, padding: 18, gap: 10, shadowOpacity: 1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  reflectionIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  quote: { fontSize: 14.5, fontWeight: '600', lineHeight: 21, fontStyle: 'italic' },
  source: { fontSize: 11.5 },
});