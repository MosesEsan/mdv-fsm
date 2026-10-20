import { useLocalSearchParams, useRouter } from 'expo-router';
import { WeekReviewScreen } from '@/modules/timesheets/routes';

export default function WeekReviewRoute() {
  const router = useRouter();
  const { weekId } = useLocalSearchParams<{ weekId: string }>();
  return (
    <WeekReviewScreen
      weekId={weekId}
      onOpenDay={(date, worker) => router.push({ pathname: '/timesheets/day/[date]', params: { date, worker } })}
    />
  );
}
