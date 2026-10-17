import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useRouter } from 'expo-router';
import { useExperienceLevel } from '@/hooks/use-experience-level';
import { useProfile } from '@/hooks/use-profile';
import { startersFor } from '@/services/ask-starters';
import { askAi, type AiSource } from '@/services/aiApi';
import type { ThemeColors } from '@/theme/colors';
import { useTheme } from '@/theme/theme-context';

type MessageRole = 'user' | 'assistant';
type ChatMessage = { id: string; role: MessageRole; text: string; createdAt: number; sources?: AiSource[] };
type Conversation = { id: string; title: string; messages: ChatMessage[]; updatedAt: number };

const STORAGE_KEY = 'rihla:conversations';
const DRAWER_WIDTH = Math.min(300, Dimensions.get('window').width * 0.82);

function now() {
  return Date.now();
}

function newId() {
  return `${now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function titleFromText(text: string) {
  return text.length > 42 ? `${text.slice(0, 42)}…` : text;
}

function formatMeta(updatedAt: number) {
  const days = Math.floor((now() - updatedAt) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function AskScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { level } = useExperienceLevel();
  const { initial, displayName } = useProfile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const slide = useSharedValue(0);

  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!live || !raw) return;
        try {
          setConversations(JSON.parse(raw));
        } catch {
          // Corrupted local data — start fresh rather than crashing the tab.
        }
      })
      .finally(() => {
        if (live) setHydrated(true);
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(conversations)).catch(() => {});
  }, [conversations, hydrated]);

  const sortedConversations = useMemo(
    () => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    [conversations],
  );
  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

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

  const startNewChat = () => {
    setActiveId(null);
    setDraft('');
    setView('chat');
    closeDrawer();
  };

  const openConversation = (id: string) => {
    setActiveId(id);
    setView('chat');
    closeDrawer();
  };

  const backToList = () => setView('list');

  const deleteConversation = (id: string, title: string) => {
    Alert.alert('Delete conversation', `Remove "${title}" from this device? This can’t be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setConversations((prev) => prev.filter((c) => c.id !== id));
          if (activeId === id) {
            setActiveId(null);
            setView('list');
          }
        },
      },
    ]);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const targetId = activeId ?? newId();
    const sentAt = now();
    const userMessage: ChatMessage = { id: newId(), role: 'user', text: trimmed, createdAt: sentAt };
    const history = (activeConversation?.messages ?? []).map((m) => ({ role: m.role, text: m.text }));

    setConversations((prev) => {
      const exists = prev.some((c) => c.id === targetId);
      if (exists) {
        return prev.map((c) =>
          c.id === targetId ? { ...c, messages: [...c.messages, userMessage], updatedAt: sentAt } : c,
        );
      }
      const conversation: Conversation = {
        id: targetId,
        title: titleFromText(trimmed),
        messages: [userMessage],
        updatedAt: sentAt,
      };
      return [conversation, ...prev];
    });

    if (!activeId) setActiveId(targetId);
    setDraft('');
    setView('chat');
    setSending(true);

    let replyText: string;
    let sources: AiSource[] = [];
    try {
      const answer = await askAi(trimmed, history, level);
      replyText = answer.reply;
      sources = answer.sources;
    } catch {
      replyText = "Sorry, I couldn't reach the AI just now. Check your connection and try again in a moment.";
    }

    const repliedAt = now();
    const assistantMessage: ChatMessage = {
      id: newId(),
      role: 'assistant',
      text: replyText,
      createdAt: repliedAt,
      ...(sources.length > 0 && { sources }),
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetId ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: repliedAt } : c,
      ),
    );
    setSending(false);
  };

  const openSource = (source: AiSource) => {
    if (source.kind === 'quran') router.push(`/quran/${source.surahId}?ayah=${source.ayah}` as any);
    else router.push(`/hadith/${source.collection}/${source.section}` as any);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {view === 'list' ? (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={openDrawer}
              >
                <Ionicons name="menu-outline" size={19} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.flex}>
                <Text style={[styles.kicker, { color: colors.accent }]}>RIHLA GUIDE</Text>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Ask anything.</Text>
              </View>
              <TouchableOpacity style={[styles.newButton, { backgroundColor: colors.accent }]} onPress={startNewChat}>
                <Ionicons name="add" size={20} color={colors.accentOn} />
                <Text style={[styles.newText, { color: colors.accentOn }]}>New</Text>
              </TouchableOpacity>
            </View>

            <LinearGradient
              colors={colors.heroGradient as [string, string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.hero, { shadowColor: colors.heroShadow }]}
            >
              <Ionicons name="moon-outline" size={64} color="rgba(255,255,255,0.07)" style={styles.heroEmblem} />
              <View style={styles.guideIcon}>
                <Ionicons name="sparkles-outline" color="#FFFFFF" size={21} />
              </View>
              <Text style={styles.heroTitle}>Your private learning space</Text>
              <Text style={styles.heroText}>Clear, considered answers with sources you can explore.</Text>
            </LinearGradient>

            <Text style={[styles.label, { color: colors.textTertiary }]}>RECENT CONVERSATIONS</Text>
            {sortedConversations.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No conversations yet. Ask something below to start one.
                </Text>
              </View>
            ) : (
              <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
                {sortedConversations.map((chat, index) => (
                  <TouchableOpacity
                    key={chat.id}
                    style={[styles.chatRow, index !== sortedConversations.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                    onPress={() => openConversation(chat.id)}
                    onLongPress={() => deleteConversation(chat.id, chat.title)}
                  >
                    <View style={[styles.chatIcon, { backgroundColor: colors.iconCircle, borderColor: colors.iconBorder }]}>
                      <Ionicons name="chatbubble-outline" size={17} color={colors.textSecondary} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={[styles.chatTitle, { color: colors.textPrimary }]} numberOfLines={1}>{chat.title}</Text>
                      <Text style={[styles.chatMeta, { color: colors.textSecondary }]}>Rihla Guide · {formatMeta(chat.updatedAt)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={17} color={colors.textTertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Composer value={draft} onChangeText={setDraft} onSend={() => sendMessage(draft)} colors={colors} />
            <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
              Rihla provides learning guidance with sources, not personal religious rulings.
            </Text>
          </ScrollView>
        ) : (
          <>
            <View style={styles.header}>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={backToList}
              >
                <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.flex}>
                <Text style={[styles.kicker, { color: colors.accent }]}>RIHLA GUIDE</Text>
                <Text style={[styles.title, styles.chatHeaderTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {activeConversation?.title ?? 'New chat'}
                </Text>
              </View>
              {activeConversation && (
                <TouchableOpacity
                  style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => deleteConversation(activeConversation.id, activeConversation.title)}
                >
                  <Ionicons name="trash-outline" size={17} color={colors.negative} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.thread}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              {!activeConversation && (
                <View style={styles.starterWrap}>
                  <View style={[styles.guideIcon, styles.guideIconLight, { backgroundColor: colors.accentTint }]}>
                    <Ionicons name="sparkles-outline" color={colors.accent} size={21} />
                  </View>
                  <Text style={[styles.starterTitle, { color: colors.textPrimary }]}>Ask about prayer, Quran or daily practice</Text>
                  <View style={styles.starterList}>
                    {startersFor(level).map((prompt) => (
                      <TouchableOpacity
                        key={prompt.title}
                        style={[styles.starterChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => sendMessage(prompt.title)}
                      >
                        <Ionicons name={prompt.icon} size={15} color={colors.accent} />
                        <Text style={[styles.starterChipText, { color: colors.textPrimary }]}>{prompt.title}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {activeConversation?.messages.map((message) => (
                <MessageBubble key={message.id} message={message} colors={colors} onOpenSource={openSource} />
              ))}

              {sending && (
                <View style={styles.bubbleRow}>
                  <View style={[styles.bubbleAvatar, { backgroundColor: colors.accentTint, borderColor: colors.accent }]}>
                    <Ionicons name="sparkles-outline" size={14} color={colors.accent} />
                  </View>
                  <View style={[styles.bubble, styles.bubbleAssistant, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.bubbleText, { color: colors.textSecondary }]}>Typing…</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.composerPad}>
              <Composer value={draft} onChangeText={setDraft} onSend={() => sendMessage(draft)} colors={colors} />
            </View>
          </>
        )}
      </KeyboardAvoidingView>

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
                style={[styles.newChatRow, { backgroundColor: colors.accentTint }]}
                onPress={startNewChat}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
                <Text style={[styles.newChatText, { color: colors.accent }]}>New chat</Text>
              </TouchableOpacity>

              <Text style={[styles.drawerLabel, { color: colors.textTertiary }]}>RECENT</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {sortedConversations.length === 0 && (
                  <Text style={[styles.drawerEmpty, { color: colors.textTertiary }]}>Nothing yet.</Text>
                )}
                {sortedConversations.map((chat) => (
                  <TouchableOpacity
                    key={chat.id}
                    style={styles.drawerRow}
                    onPress={() => openConversation(chat.id)}
                    onLongPress={() => deleteConversation(chat.id, chat.title)}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.drawerRowText, { color: colors.textPrimary }]} numberOfLines={1}>
                      {chat.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={[styles.drawerFooter, { borderTopColor: colors.border }]}>
                <View style={[styles.drawerAvatar, { backgroundColor: colors.accentTint, borderColor: colors.accent }]}>
                  <Text style={[styles.drawerAvatarText, { color: colors.accent }]}>{initial}</Text>
                </View>
                <Text style={[styles.drawerFooterText, { color: colors.textPrimary }]} numberOfLines={1}>{displayName}</Text>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

function MessageBubble({
  message,
  colors,
  onOpenSource,
}: {
  message: ChatMessage;
  colors: ThemeColors;
  onOpenSource: (source: AiSource) => void;
}) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      {!isUser && (
        <View style={[styles.bubbleAvatar, { backgroundColor: colors.accentTint, borderColor: colors.accent }]}>
          <Ionicons name="sparkles-outline" size={14} color={colors.accent} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.bubbleUser, { backgroundColor: colors.accent }]
            : [styles.bubbleAssistant, { backgroundColor: colors.surface, borderColor: colors.border }],
        ]}
      >
        <Text style={[styles.bubbleText, { color: isUser ? colors.accentOn : colors.textPrimary }]}>{message.text}</Text>
        {!isUser && !!message.sources?.length && (
          <View style={[styles.sources, { borderTopColor: colors.border }]}>
            <Text style={[styles.sourcesLabel, { color: colors.textTertiary }]}>SOURCES</Text>
            {message.sources.map((source) => (
              <TouchableOpacity
                key={`${source.kind}-${source.label}`}
                style={[styles.sourceChip, { backgroundColor: colors.accentTint, borderColor: colors.accent }]}
                onPress={() => onOpenSource(source)}
                accessibilityRole="link"
                accessibilityLabel={`Open ${source.label}`}
              >
                <Ionicons name={source.kind === 'quran' ? 'book-outline' : 'library-outline'} size={14} color={colors.accent} />
                <View style={styles.flex}>
                  <Text style={[styles.sourceTitle, { color: colors.accent }]} numberOfLines={1}>{source.label}</Text>
                  {source.kind === 'hadith' && !!source.excerpt && (
                    <Text style={[styles.sourceExcerpt, { color: colors.textSecondary }]} numberOfLines={2}>{source.excerpt}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.accent} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function Composer({
  value,
  onChangeText,
  onSend,
  colors,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  colors: ThemeColors;
}) {
  return (
    <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow }]}>
      <TextInput
        multiline
        value={value}
        onChangeText={onChangeText}
        placeholder="Ask about prayer, Quran or daily practice…"
        placeholderTextColor={colors.textTertiary}
        style={[styles.input, { color: colors.textPrimary }]}
      />
      <TouchableOpacity
        style={[styles.send, { backgroundColor: value.trim() ? colors.accent : colors.iconCircle }]}
        onPress={onSend}
        disabled={!value.trim()}
      >
        <Ionicons name="arrow-up" size={19} color={value.trim() ? colors.accentOn : colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 18, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, paddingBottom: 8 },
  iconButton: { height: 38, width: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  kicker: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 25, fontWeight: '700', letterSpacing: -0.8, marginTop: 5 },
  chatHeaderTitle: { fontSize: 18 },
  newButton: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9 },
  newText: { fontWeight: '700', fontSize: 12 },
  hero: {
    borderRadius: 24,
    padding: 20,
    marginTop: 24,
    overflow: 'hidden',
    shadowOpacity: 1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  heroEmblem: { position: 'absolute', top: -8, right: -6 },
  guideIcon: {
    height: 42,
    width: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  guideIconLight: { alignSelf: 'center' },
  heroTitle: { fontSize: 17, fontWeight: '700', marginTop: 16, color: '#FFFFFF' },
  heroText: { fontSize: 12.5, lineHeight: 18, marginTop: 6, color: 'rgba(255,255,255,0.75)' },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 29, marginBottom: 10 },
  groupCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  emptyCard: { borderWidth: 1, borderRadius: 18, padding: 18, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  chatRow: { paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  chatIcon: { height: 38, width: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  chatTitle: { fontSize: 14, fontWeight: '600' },
  chatMeta: { fontSize: 11, marginTop: 4 },
  composer: {
    borderWidth: 1,
    borderRadius: 20,
    minHeight: 95,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    marginTop: 29,
  },
  composerPad: { paddingHorizontal: 18, paddingBottom: 100 },
  input: { flex: 1, fontSize: 14, minHeight: 50, textAlignVertical: 'top', paddingRight: 8 },
  send: { height: 38, width: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { fontSize: 10, lineHeight: 15, marginTop: 10, paddingHorizontal: 3 },
  thread: { padding: 18, paddingBottom: 12, gap: 12 },
  starterWrap: { alignItems: 'center', paddingVertical: 24, gap: 16 },
  starterTitle: { fontSize: 15, fontWeight: '700', textAlign: 'center', maxWidth: 260 },
  starterList: { width: '100%', gap: 9 },
  starterChip: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  starterChipText: { fontSize: 13, fontWeight: '600', flex: 1 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, maxWidth: '90%', alignSelf: 'flex-start' },
  bubbleRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  bubbleAvatar: { height: 26, width: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 11, flexShrink: 1 },
  bubbleUser: { borderTopRightRadius: 6 },
  bubbleAssistant: { borderTopLeftRadius: 6, borderWidth: 1 },
  bubbleText: { fontSize: 14, lineHeight: 20, flexShrink: 1 },
  sources: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, gap: 7 },
  sourcesLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  sourceChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  sourceTitle: { fontSize: 12.5, fontWeight: '700' },
  sourceExcerpt: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  overlay: { backgroundColor: 'rgba(0,0,0,0.4)' },
  drawer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: DRAWER_WIDTH, borderRightWidth: 1, padding: 16 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  drawerTitle: { fontSize: 17, fontWeight: '700' },
  newChatRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, padding: 13, marginTop: 18 },
  newChatText: { fontSize: 14, fontWeight: '700' },
  drawerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 22, marginBottom: 6 },
  drawerEmpty: { fontSize: 12, paddingVertical: 8 },
  drawerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  drawerRowText: { fontSize: 13, fontWeight: '600', flex: 1 },
  drawerFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, paddingTop: 14 },
  drawerAvatar: { height: 30, width: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  drawerAvatarText: { fontSize: 12, fontWeight: '700' },
  drawerFooterText: { fontSize: 13, fontWeight: '600' },
});
