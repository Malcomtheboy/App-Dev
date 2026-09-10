import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/theme-context';

const chats = [
  { title: 'How do I make wudu?', meta: 'Today', icon: 'water-outline' as const, tint: '#4C8DFF' },
  { title: 'What breaks the fast?', meta: 'Yesterday', icon: 'moon-outline' as const, tint: '#8B5CF6' },
  { title: 'Meaning of Surah Al-Ikhlas', meta: '3d ago', icon: 'book-outline' as const, tint: '#22C3A6' },
  { title: 'Best time for Duha prayer', meta: '5d ago', icon: 'time-outline' as const, tint: '#FF9F45' },
];

const DRAWER_WIDTH = Math.min(300, Dimensions.get('window').width * 0.82);

export default function AskScreen() {
  const { colors } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const slide = useSharedValue(0);

  const openDrawer = () => {
    setDrawerOpen(true);
    slide.value = withTiming(1, { duration: 240 });
  };

  const closeDrawer = () => {
    slide.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) runOnJS(setDrawerOpen)(false);
    });
  };

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (slide.value - 1) * DRAWER_WIDTH }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: slide.value }));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={openDrawer}
          >
            <Ionicons name="menu-outline" size={19} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.flex}>
            <Text style={[styles.kicker, { color: colors.textSecondary }]}>RIHLA GUIDE</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Ask anything.</Text>
          </View>
          <TouchableOpacity style={[styles.newButton, { backgroundColor: colors.accent }]}>
            <Ionicons name="add" size={20} color={colors.accentOn} />
            <Text style={[styles.newText, { color: colors.accentOn }]}>New</Text>
          </TouchableOpacity>
        </View>

        <LinearGradient colors={colors.gradientPromo as [string, string, string]} style={styles.hero}>
          <View style={styles.guideIcon}>
            <Ionicons name="sparkles" color="#FFFFFF" size={22} />
          </View>
          <Text style={styles.heroTitle}>Your private learning space</Text>
          <Text style={styles.heroText}>Clear, considered answers with sources you can explore.</Text>
        </LinearGradient>

        <Text style={[styles.label, { color: colors.textSecondary }]}>RECENT CONVERSATIONS</Text>
        {chats.map((chat) => (
          <TouchableOpacity key={chat.title} style={[styles.chatRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.chatIcon, { backgroundColor: `${chat.tint}26` }]}>
              <Ionicons name={chat.icon} size={17} color={chat.tint} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.chatTitle, { color: colors.textPrimary }]}>{chat.title}</Text>
              <Text style={[styles.chatMeta, { color: colors.textSecondary }]}>Rihla Guide · {chat.meta}</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.textTertiary} />
          </TouchableOpacity>
        ))}

        <Text style={[styles.label, { color: colors.textSecondary }]}>START A CONVERSATION</Text>
        <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            multiline
            placeholder="Ask about prayer, Quran or daily practice…"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.textPrimary }]}
          />
          <TouchableOpacity style={[styles.send, { backgroundColor: colors.accent }]}>
            <Ionicons name="arrow-up" size={19} color={colors.accentOn} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
          Rihla provides learning guidance with sources, not personal religious rulings.
        </Text>
      </ScrollView>

      {drawerOpen && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View
            style={[styles.drawer, { backgroundColor: colors.surface, borderColor: colors.border }, drawerStyle]}
          >
            <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
              <View style={styles.drawerHeader}>
                <Text style={[styles.drawerTitle, { color: colors.textPrimary }]}>Conversations</Text>
                <TouchableOpacity onPress={closeDrawer} style={[styles.iconButton, { backgroundColor: colors.iconCircle, borderColor: colors.border }]}>
                  <Ionicons name="close" size={17} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.newChatRow, { backgroundColor: colors.iconCircle }]}
                onPress={closeDrawer}
              >
                <Ionicons name="add-circle" size={20} color={colors.accent} />
                <Text style={[styles.newChatText, { color: colors.textPrimary }]}>New chat</Text>
              </TouchableOpacity>

              <Text style={[styles.drawerLabel, { color: colors.textSecondary }]}>RECENT</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {chats.map((chat) => (
                  <TouchableOpacity key={chat.title} style={styles.drawerRow} onPress={closeDrawer}>
                    <Ionicons name={chat.icon} size={16} color={chat.tint} />
                    <Text style={[styles.drawerRowText, { color: colors.textPrimary }]} numberOfLines={1}>
                      {chat.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={[styles.drawerFooter, { borderTopColor: colors.border }]}>
                <LinearGradient colors={[colors.purple, colors.blue]} style={styles.drawerAvatar}>
                  <Text style={styles.drawerAvatarText}>A</Text>
                </LinearGradient>
                <Text style={[styles.drawerFooterText, { color: colors.textPrimary }]}>Your account</Text>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 18, paddingBottom: 120 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: { height: 38, width: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  kicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -1, marginTop: 5 },
  newButton: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9 },
  newText: { fontWeight: '800', fontSize: 12 },
  hero: { borderRadius: 22, padding: 19, marginTop: 24 },
  guideIcon: {
    height: 43,
    width: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroTitle: { fontSize: 18, fontWeight: '700', marginTop: 17, color: '#FFFFFF' },
  heroText: { fontSize: 13, lineHeight: 19, marginTop: 6, color: 'rgba(255,255,255,0.78)' },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 29, marginBottom: 10 },
  chatRow: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  chatIcon: { height: 38, width: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  chatTitle: { fontSize: 14, fontWeight: '600' },
  chatMeta: { fontSize: 11, marginTop: 4 },
  composer: { borderWidth: 1, borderRadius: 20, minHeight: 95, padding: 14, flexDirection: 'row', alignItems: 'flex-end' },
  input: { flex: 1, fontSize: 14, minHeight: 50, textAlignVertical: 'top', paddingRight: 8 },
  send: { height: 38, width: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { fontSize: 10, lineHeight: 15, marginTop: 10, paddingHorizontal: 3 },
  overlay: { backgroundColor: 'rgba(0,0,0,0.5)' },
  drawer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: DRAWER_WIDTH, borderRightWidth: 1, padding: 16 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  drawerTitle: { fontSize: 17, fontWeight: '700' },
  newChatRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, padding: 13, marginTop: 18 },
  newChatText: { fontSize: 14, fontWeight: '700' },
  drawerLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 22, marginBottom: 6 },
  drawerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  drawerRowText: { fontSize: 13, fontWeight: '600', flex: 1 },
  drawerFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, paddingTop: 14 },
  drawerAvatar: { height: 30, width: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  drawerAvatarText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  drawerFooterText: { fontSize: 13, fontWeight: '600' },
});
