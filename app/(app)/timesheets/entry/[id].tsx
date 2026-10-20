import { useLocalSearchParams, useRouter } from 'expo-router';
import { EntryFormScreen } from '@/modules/timesheets/routes';

export default function EntryRoute() {
  const router = useRouter();
  const { id, date, worker } = useLocalSearchParams<{ id: string; date?: string; worker?: string }>();
  return id === 'new'
    ? <EntryFormScreen date={date as string} workerId={worker} onDone={() => router.back()} />
    : <EntryFormScreen entryId={id} onDone={() => router.back()} />;
}
