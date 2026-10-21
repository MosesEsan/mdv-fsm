import { useLocalSearchParams, useRouter } from 'expo-router';
import { VisitScreen } from '@/modules/timesheets/routes';

export default function VisitRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  return <VisitScreen id={id} onBack={() => (router.canGoBack() ? router.back() : router.replace('/timesheets/visits'))}
    onEdit={() => router.push({ pathname: '/timesheets/visits/[id]/edit', params: { id } })}
    onDeleted={() => router.replace('/timesheets/visits')}
    onReport={(customer, month) => router.push({ pathname: '/timesheets/visits/report', params: { customer, month } })} />;
}
