import { Stack } from 'expo-router';
import { colors } from '../../../src/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Admin' }} />
      <Stack.Screen name="members" options={{ title: 'Members' }} />
      <Stack.Screen name="levies" options={{ title: 'Levies & Dues' }} />
      <Stack.Screen name="dues" options={{ title: 'All Dues' }} />
      <Stack.Screen name="expenses" options={{ title: 'Market Expenses' }} />
      <Stack.Screen name="announcements" options={{ title: 'Announcements' }} />
    </Stack>
  );
}
