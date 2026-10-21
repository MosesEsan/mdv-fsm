import { useRouter } from 'expo-router';
import { VisitFormScreen } from '@/modules/timesheets/routes';

export default function NewVisitRoute() {
  const router = useRouter();
  return <VisitFormScreen onBack={() => router.back()} onSaved={(id) => router.replace({ pathname: '/visit/[id]', params: { id, saved: '1' } })} />;
}
