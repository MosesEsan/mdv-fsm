import { useLocalSearchParams, useRouter } from 'expo-router';
import { DayScreen } from '@/modules/timesheets/routes';

export default function DayRoute() {
  const router = useRouter();
  const { date, worker } = useLocalSearchParams<{ date: string; worker?: string }>();
  return (
    <DayScreen
      date={date}
      workerId={worker}
      onAddEntry={(d, w) => router.push({ pathname: '/timesheets/entry/[id]', params: { id: 'new', date: d, worker: w } })}
      onOpenEntry={(id) => router.push({ pathname: '/timesheets/entry/[id]', params: { id } })}
    />
  );
}
