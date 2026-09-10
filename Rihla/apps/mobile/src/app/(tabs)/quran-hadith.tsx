import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/theme-context';

type IconName = keyof typeof Ionicons.glyphMap;

const collections: { title: string; subtitle: string; icon: IconName; tint: string }[] = [
  { title: 'Sahih al-Bukhari', subtitle: '7,563 hadith', icon: 'library-outline', tint: '#4C8DFF' },
  { title: 'Sahih Muslim', subtitle: '7,190 hadith', icon: 'bookmarks-outline', tint: '#8B5CF6' },
  { title: '40 Hadith Nawawi', subtitle: '42 hadith', icon: 'ribbon-outline', tint: '#22C3A6' },
];

const juzShortcuts = [1, 2, 3, 4, 5, 6];

export default function LearnScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Quran & Hadith</Text>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>A quiet place to learn, reflect and return.</Text>

        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={19} color={colors.textTertiary} />
          <TextInput
            placeholder="Search Quran and Hadith"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.textPrimary }]}
          />
        </View>

        <Text style={[styles.overline, { color: colors.textSecondary }]}>CONTINUE READING</Text>
        <LinearGradient colors={colors.gradientHero as [string, string, string]} style={styles.continueCard}>
          <View style={styles.continueIcon}>
            <Ionicons name="book" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.copy}>
            <Text style={styles.continueTitle}>Al-Fatihah</Text>
            <Text style={styles.continueSub}>The Opening · Verse 1–3</Text>
            <View style={[styles.progressTrack]}>
              <View style={[styles.progressFill, { width: '38%', backgroundColor: colors.accent }]} />
            </View>
          </View>
          <View style={styles.continueArrow}>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </View>
        </LinearGradient>

        <Text style={[styles.overline, { color: colors.textSecondary }]}>JUMP TO JUZ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.juzScroll}>
          {juzShortcuts.map((juz) => (
            <TouchableOpacity key={juz} style={[styles.juzChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.juzChipText, { color: colors.textPrimary }]}>Juz {juz}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Hadith collections</Text>
        {collections.map((collection) => (
          <TouchableOpacity key={collection.title} style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.itemIcon, { backgroundColor: `${collection.tint}26` }]}>
              <Ionicons name={collection.icon} size={19} color={collection.tint} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{collection.title}</Text>
              <Text style={[styles.sub, { color: colors.textSecondary }]}>{collection.subtitle}</Text>
            </View>
            <Ionicons name="arrow-forward" size={17} color={colors.textPrimary} />
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Daily reflection</Text>
        <View style={[styles.reflectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.reflectionIcon, { backgroundColor: `${colors.gold}26` }]}>
            <Ionicons name="sunny-outline" size={19} color={colors.gold} />
          </View>
          <Text style={[styles.reflectionQuote, { color: colors.textPrimary }]}>
            “Indeed, with hardship comes ease.”
          </Text>
          <Text style={[styles.reflectionSource, { color: colors.textSecondary }]}>Surah Ash-Sharh, 94:6</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 130 },
  heading: { fontSize: 28, fontWeight: '700', letterSpacing: -0.7 },
  intro: { fontSize: 14, marginTop: 7, marginBottom: 23 },
  search: { height: 52, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 },
  input: { flex: 1, fontSize: 14 },
  overline: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 29, marginBottom: 10 },
  continueCard: { borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 13, overflow: 'hidden' },
  continueIcon: {
    height: 46,
    width: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  copy: { flex: 1 },
  continueTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  continueSub: { fontSize: 12, marginTop: 4, color: 'rgba(255,255,255,0.72)' },
  progressTrack: { height: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.18)', marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  continueArrow: { height: 34, width: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  juzScroll: { marginHorizontal: -20 },
  juzChip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, marginLeft: 20 },
  juzChipText: { fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, marginTop: 31, marginBottom: 12 },
  item: { borderWidth: 1, borderRadius: 19, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 10 },
  itemIcon: { height: 40, width: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 12, marginTop: 4 },
  reflectionCard: { borderWidth: 1, borderRadius: 20, padding: 18, alignItems: 'flex-start', gap: 10 },
  reflectionIcon: { height: 38, width: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  reflectionQuote: { fontSize: 15, fontWeight: '600', lineHeight: 22, fontStyle: 'italic' },
  reflectionSource: { fontSize: 12 },
});
