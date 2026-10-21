import { useRouter } from 'expo-router';
import { VisitsTodayScreen } from '@/modules/timesheets/routes';

export default function VisitsTodayRoute() {
  const router = useRouter();
  return <VisitsTodayScreen onLog={() => router.push('/timesheets/visits/new')} onOpen={(id) => router.push({ pathname: '/timesheets/visits/[id]', params: { id } })} />;
}
