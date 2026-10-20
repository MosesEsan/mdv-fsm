import { Stack } from 'expo-router';
import { FeatureGate } from '@/core/modules/FeatureGate';
import { SCHEDULING } from '@/core/scheduling';

export default function ScheduleLayout() {
  return (
      <FeatureGate feature={SCHEDULING} name="The schedule">
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Schedule' }} />
          <Stack.Screen name="[bookingId]" options={{ title: 'Job sheet' }} />
          <Stack.Screen name="edit/[bookingId]" options={{ title: 'Booking' }} />
        </Stack>
      </FeatureGate>
  );
}
