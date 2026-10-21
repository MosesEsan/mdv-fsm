import { Stack } from 'expo-router';

/** Customer-visit screens draw their own bar (AppBar). Today, Entries and Report are tabs: no slide between them. */
export default function VisitsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="entries" options={{ animation: 'none' }} />
      <Stack.Screen name="report" options={{ animation: 'none' }} />
    </Stack>
  );
}
