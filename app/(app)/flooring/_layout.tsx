import { Stack } from 'expo-router';
import { FeatureGate } from '@/core/modules/FeatureGate';
import { FLOORING } from '@/modules/flooring/routes';

export default function FlooringLayout() {
  return (
    <FeatureGate feature={FLOORING} name="Flooring">
      <Stack>
        <Stack.Screen name="enquiries/index" options={{ title: 'Enquiries' }} />
        <Stack.Screen name="enquiries/new" options={{ title: 'New enquiry' }} />
        <Stack.Screen name="enquiries/[jobId]" options={{ title: 'Enquiry' }} />
        <Stack.Screen name="viewings/index" options={{ title: 'Viewings' }} />
        <Stack.Screen name="viewings/[jobId]" options={{ title: 'Viewing' }} />
      </Stack>
    </FeatureGate>
  );
}
