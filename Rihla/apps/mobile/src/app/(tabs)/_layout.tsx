import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ColorValue, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/theme-context';

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({
  focused,
  color,
  activeIcon,
  inactiveIcon,
  label,
}: {
  focused: boolean;
  color: ColorValue;
  activeIcon: IconName;
  inactiveIcon: IconName;
  label: string;
}) {
  const { colors } = useTheme();

  if (focused) {
    return (
      <View style={[styles.pill, { backgroundColor: colors.accent }]}>
        <Ionicons name={activeIcon} size={19} color={colors.accentOn} />
      </View>
    );
  }

  return (
    <View style={styles.plain}>
      <Ionicons name={inactiveIcon} size={19} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 22,
          height: 66,
          borderRadius: 33,
          backgroundColor: colors.surfaceElevated,
          borderTopWidth: 0,
          paddingHorizontal: 6,
          elevation: 12,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
        },
        tabBarItemStyle: { paddingTop: 6 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} activeIcon="home" inactiveIcon="home-outline" label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="quran-hadith"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} activeIcon="book" inactiveIcon="book-outline" label="Learn" />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Ask',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              activeIcon="chatbubble"
              inactiveIcon="chatbubble-outline"
              label="Ask"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              activeIcon="stats-chart"
              inactiveIcon="stats-chart-outline"
              label="Progress"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              activeIcon="person"
              inactiveIcon="person-outline"
              label="Profile"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  plain: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: 58,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  pill: {
    height: 42,
    width: 58,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
