import { Stack } from 'expo-router';
import { FeatureGate } from '@/core/modules/FeatureGate';
import { SCHEDULING } from '@/core/scheduling';

export default function MyJobsLayout() {
  return (
      <FeatureGate feature={SCHEDULING} name="The schedule">
        <Stack>
          <Stack.Screen name="index" options={{ title: 'My jobs' }} />
          <Stack.Screen name="[bookingId]" options={{ title: 'Job sheet' }} />
        </Stack>
      </FeatureGate>
  );
}
