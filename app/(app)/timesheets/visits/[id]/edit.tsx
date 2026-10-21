import { useLocalSearchParams, useRouter } from 'expo-router';
import { VisitFormScreen } from '@/modules/timesheets/routes';

export default function EditVisitRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  return <VisitFormScreen id={id} onBack={() => router.back()} onSaved={() => router.back()} />;
}
