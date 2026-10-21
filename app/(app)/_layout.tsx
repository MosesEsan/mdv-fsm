import { View } from 'react-native';
import { Stack } from 'expo-router';
import { TabBar } from '@/core/modules/TabBar';

// Sections that can be bottom tabs: switching between them swaps the screen with no slide.
// Everything else (Team, a job, a visit…) is a normal push and slides in.
const TAB_SECTIONS = ['index', 'settings', 'jobs', 'customers', 'extra-work', 'timesheets'] as const;

/** Signed-in app. The tab bar lives here, outside the screens, so it doesn't move or redraw. */
export default function AppLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        {TAB_SECTIONS.map((name) => <Stack.Screen key={name} name={name} options={{ animation: 'none' }} />)}
      </Stack>
      <TabBar />
    </View>
  );
}
