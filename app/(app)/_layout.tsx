import { Platform } from 'react-native';
import { Stack } from 'expo-router';

/**
 * Signed-in app: the tabs, with everything else (Team, a visit, the schedule…) opening over them.
 * Same slide from the right on iPhone and Android.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
