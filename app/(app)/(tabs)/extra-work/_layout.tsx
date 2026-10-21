import { Stack } from 'expo-router';
import { FeatureGate } from '@/core/modules/FeatureGate';
import { EXTRA_WORK } from '@/modules/extraWork/routes';

export default function ExtraWorkLayout() {
  return (
    <FeatureGate feature={EXTRA_WORK} name="Extra work">
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" options={{ title: 'Extra work' }} />
        <Stack.Screen name="new" options={{ title: 'Log extra work' }} />
        <Stack.Screen name="[entryId]" options={{ title: 'Extra work' }} />
      </Stack>
    </FeatureGate>
  );
}
