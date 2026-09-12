import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ColorValue, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/theme-context';

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({
  focused,
  color,
  activeIcon,
  inactiveIcon,
}: {
  focused: boolean;
  color: ColorValue;
  activeIcon: IconName;
  inactiveIcon: IconName;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.item}>
      <Ionicons name={focused ? activeIcon : inactiveIcon} size={21} color={color} />
      <View style={[styles.dot, focused && { backgroundColor: colors.accent }]} />
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 22,
          height: 62,
          borderRadius: 31,
          backgroundColor: colors.surfaceElevated,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
        },
        tabBarItemStyle: { paddingTop: 6 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} activeIcon="home" inactiveIcon="home-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="quran-hadith"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} activeIcon="book" inactiveIcon="book-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Ask',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} activeIcon="chatbubble" inactiveIcon="chatbubble-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} activeIcon="stats-chart" inactiveIcon="stats-chart-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} activeIcon="person" inactiveIcon="person-outline" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: 44,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'transparent',
  },
});
