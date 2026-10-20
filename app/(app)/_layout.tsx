import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: true, title: 'Home' }} />
      <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
    </Stack>
  );
}
