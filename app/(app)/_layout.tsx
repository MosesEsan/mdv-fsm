import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Home' }} />
      <Stack.Screen name="settings" options={{ headerShown: false, title: 'Settings' }} />
    </Stack>
  );
}
