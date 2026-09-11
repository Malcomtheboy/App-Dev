import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/theme-context';

type IconName = keyof typeof Ionicons.glyphMap;

const collections: { title: string; subtitle: string; icon: IconName }[] = [
  { title: 'Sahih al-Bukhari', subtitle: '7,563 hadith', icon: 'library-outline' },
  { title: 'Sahih Muslim', subtitle: '7,190 hadith', icon: 'bookmarks-outline' },
  { title: '40 Hadith Nawawi', subtitle: '42 hadith', icon: 'ribbon-outline' },
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

        <Text style={[styles.overline, { color: colors.textTertiary }]}>CONTINUE READING</Text>
        <LinearGradient
          colors={colors.heroGradient as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.continueCard, { shadowColor: colors.heroShadow }]}
        >
          <Ionicons name="moon-outline" size={60} color="rgba(255,255,255,0.07)" style={styles.continueEmblem} />
          <View style={styles.continueIcon}>
            <Ionicons name="book-outline" size={21} color="#FFFFFF" />
          </View>
          <View style={styles.copy}>
            <Text style={styles.continueTitle}>Al-Fatihah</Text>
            <Text style={styles.continueSub}>The Opening · Verse 1–3</Text>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>
          <View style={styles.continueArrow}>
            <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
          </View>
        </LinearGradient>

        <Text style={[styles.overline, { color: colors.textTertiary }]}>JUMP TO JUZ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.juzScroll}>
          {juzShortcuts.map((juz) => (
            <TouchableOpacity key={juz} style={[styles.juzChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.juzChipText, { color: colors.textPrimary }]}>Juz {juz}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Hadith collections</Text>
        <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
          {collections.map((collection, index) => (
            <TouchableOpacity
              key={collection.title}
              style={[styles.item, index !== collections.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <View style={[styles.itemIcon, { backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
                <Ionicons name={collection.icon} size={18} color={colors.textSecondary} />
              </View>
              <View style={styles.copy}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>{collection.title}</Text>
                <Text style={[styles.sub, { color: colors.textSecondary }]}>{collection.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Daily reflection</Text>
        <View style={[styles.reflectionCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
          <View style={[styles.reflectionIcon, { backgroundColor: colors.accentTint }]}>
            <Ionicons name="sunny-outline" size={18} color={colors.accent} />
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
  heading: { fontSize: 27, fontWeight: '700', letterSpacing: -0.6 },
  intro: { fontSize: 14, marginTop: 7, marginBottom: 23 },
  search: { height: 50, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 },
  input: { flex: 1, fontSize: 14 },
  overline: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 27, marginBottom: 10 },
  continueCard: {
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    overflow: 'hidden',
    shadowOpacity: 1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  continueEmblem: { position: 'absolute', top: -8, right: -4 },
  continueIcon: {
    height: 44,
    width: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  copy: { flex: 1 },
  continueTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  continueSub: { fontSize: 11.5, marginTop: 4, color: 'rgba(255,255,255,0.72)' },
  progressTrack: { height: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.18)', marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', width: '38%', borderRadius: 4, backgroundColor: '#FFFFFF' },
  continueArrow: { height: 32, width: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  juzScroll: { marginHorizontal: -20 },
  juzChip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, marginLeft: 20 },
  juzChipText: { fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, marginTop: 30, marginBottom: 12 },
  groupCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  item: { paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 13 },
  itemIcon: { height: 38, width: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  title: { fontSize: 14.5, fontWeight: '600' },
  sub: { fontSize: 11.5, marginTop: 4 },
  reflectionCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    alignItems: 'flex-start',
    gap: 10,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  reflectionIcon: { height: 38, width: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  reflectionQuote: { fontSize: 14.5, fontWeight: '600', lineHeight: 21, fontStyle: 'italic' },
  reflectionSource: { fontSize: 11.5 },
});
