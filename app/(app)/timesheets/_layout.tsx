import { Stack } from 'expo-router';
import { TimesheetsGate } from '@/modules/timesheets/routes';

export default function TimesheetsLayout() {
  return (
      <TimesheetsGate>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'My hours' }} />
          <Stack.Screen name="day/[date]" options={{ title: 'Day' }} />
          <Stack.Screen name="entry/[id]" options={{ title: 'Hours' }} />
          <Stack.Screen name="approvals/index" options={{ title: 'Sign-offs' }} />
          <Stack.Screen name="approvals/[weekId]" options={{ title: 'Week' }} />
          <Stack.Screen name="reports/index" options={{ title: 'Hours & export' }} />
        </Stack>
      </TimesheetsGate>
  );
}
