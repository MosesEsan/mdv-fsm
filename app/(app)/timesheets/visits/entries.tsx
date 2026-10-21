import { useRouter } from 'expo-router';
import { VisitEntriesScreen } from '@/modules/timesheets/routes';

export default function VisitEntriesRoute() {
  const router = useRouter();
  return <VisitEntriesScreen onOpen={(id) => router.push({ pathname: '/timesheets/visits/[id]', params: { id } })} />;
}
