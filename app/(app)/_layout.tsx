import { View } from 'react-native';
import { Stack } from 'expo-router';
import { TabBar } from '@/core/modules/TabBar';

/**
 * Signed-in app. Switching tabs replaces the screen with no animation, and the tab bar lives here,
 * outside the screens, so it doesn't move or redraw. Screens inside a tab (a job, a visit) still slide in.
 */
export default function AppLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
      <TabBar />
    </View>
  );
}
