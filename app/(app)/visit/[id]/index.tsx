import { useLocalSearchParams, useRouter } from 'expo-router';
import { VisitScreen } from '@/modules/timesheets/routes';

export default function VisitRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  return <VisitScreen id={id} onBack={() => (router.canGoBack() ? router.back() : router.replace('/visits'))}
    onEdit={() => router.push({ pathname: '/visit/[id]/edit', params: { id } })}
    onDeleted={() => router.replace('/visits')}
    onReport={(customer, month) => router.push({ pathname: '/visit-report', params: { customer, month } })} />;
}
