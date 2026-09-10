import { Text, StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme-context';

const collections = ['Sahih al-Bukhari', 'Sahih Muslim', "40 Hadith Nawawi"];

export default function QuranHadithScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Quran & Hadith</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={14} color={colors.textTertiary} />
          <Text style={styles.searchPlaceholder}>Search a surah or hadith</Text>
        </View>

        <TouchableOpacity style={styles.continueCard} activeOpacity={0.85}>
          <Text style={styles.continueLabel}>CONTINUE READING</Text>
          <Text style={styles.continueSura}>Al-Baqarah</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '42%' }]} />
          </View>
          <Text style={styles.progressText}>Verse 112 of 286</Text>
        </TouchableOpacity>

        {collections.map((item) => (
          <TouchableOpacity key={item} style={styles.row} activeOpacity={0.7}>
            <Text style={styles.rowText}>{item}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: 20 },
    title: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 16 },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    searchPlaceholder: { fontSize: 11, color: colors.textTertiary },
    continueCard: {
      backgroundColor: colors.heroBg,
      borderRadius: 14,
      padding: 14,
      marginTop: 16,
    },
    continueLabel: { fontSize: 9, color: colors.accent, fontWeight: '500' },
    continueSura: { fontSize: 15, fontWeight: '500', color: colors.textPrimary, marginTop: 4 },
    progressBar: { height: 4, backgroundColor: colors.border, borderRadius: 2, marginTop: 10 },
    progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
    progressText: { fontSize: 9, color: colors.textSecondary, marginTop: 6 },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowText: { fontSize: 13, color: colors.textPrimary },
  });
}