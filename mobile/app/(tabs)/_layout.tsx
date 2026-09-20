import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../src/theme';

function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{symbol}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabIcon symbol="🏠" focused={focused} /> }}
      />
      <Tabs.Screen
        name="dues"
        options={{ title: 'Dues', tabBarIcon: ({ focused }) => <TabIcon symbol="🧾" focused={focused} /> }}
      />
      <Tabs.Screen
        name="announcements"
        options={{ title: 'Announcements', tabBarIcon: ({ focused }) => <TabIcon symbol="📣" focused={focused} /> }}
      />
      <Tabs.Screen
        name="admin"
        options={{ title: 'Admin', tabBarIcon: ({ focused }) => <TabIcon symbol="🛠️" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon symbol="👤" focused={focused} /> }}
      />
    </Tabs>
  );
}
