import { Stack } from 'expo-router';
import { FeatureGate } from '@/core/modules/FeatureGate';

export default function CustomersLayout() {
  return (
    <FeatureGate feature="job_records" name="Customers">
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </FeatureGate>
  );
}
