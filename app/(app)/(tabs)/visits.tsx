import { useRouter } from 'expo-router';
import { VisitsTodayScreen, TimesheetsGate } from '@/modules/timesheets/routes';

export default function VisitsTodayRoute() {
  const router = useRouter();
  return <TimesheetsGate><VisitsTodayScreen onLog={() => router.push('/visit/new')} onOpen={(id) => router.push({ pathname: '/visit/[id]', params: { id } })} /></TimesheetsGate>;
}
