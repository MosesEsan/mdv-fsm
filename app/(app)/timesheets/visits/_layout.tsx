import { Stack } from 'expo-router';

/** Customer-visit screens draw their own bar (AppBar). */
export default function VisitsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
