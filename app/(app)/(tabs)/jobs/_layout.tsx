import { Stack } from 'expo-router';
import { FeatureGate } from '@/core/modules/FeatureGate';
import { JOB_RECORDS } from '@/core/jobRecords';

export default function JobsLayout() {
  return (
    <FeatureGate feature={JOB_RECORDS} name="Jobs">
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" options={{ title: 'Jobs' }} />
        <Stack.Screen name="new" options={{ title: 'New job' }} />
        <Stack.Screen name="[jobId]/index" options={{ title: 'Job' }} />
        <Stack.Screen name="[jobId]/edit" options={{ title: 'Edit job' }} />
        <Stack.Screen name="[jobId]/post" options={{ title: 'Post an update' }} />
        <Stack.Screen name="[jobId]/instructions" options={{ title: 'Edit instructions' }} />
      </Stack>
    </FeatureGate>
  );
}
