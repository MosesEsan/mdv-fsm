import { useRouter } from 'expo-router';
import { VisitEntriesScreen, TimesheetsGate } from '@/modules/timesheets/routes';

export default function VisitEntriesRoute() {
  const router = useRouter();
  return <TimesheetsGate><VisitEntriesScreen onOpen={(id) => router.push({ pathname: '/visit/[id]', params: { id } })} /></TimesheetsGate>;
}
