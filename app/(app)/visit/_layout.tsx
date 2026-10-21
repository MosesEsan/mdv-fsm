import { Stack } from 'expo-router';
import { TimesheetsGate } from '@/modules/timesheets/routes';

/** A customer visit: log, open, edit or correct. Opens over the tabs and slides in. */
export default function VisitLayout() {
  return (
    <TimesheetsGate>
      <Stack screenOptions={{ headerShown: false }} />
    </TimesheetsGate>
  );
}
