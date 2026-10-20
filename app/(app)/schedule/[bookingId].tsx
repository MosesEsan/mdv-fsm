import { useLocalSearchParams, useRouter } from 'expo-router';
import { JobSheetScreen } from '@/core/scheduling';

export default function ScheduleSheetRoute() {
  const router = useRouter();
  const { bookingId, date } = useLocalSearchParams<{ bookingId: string; date?: string }>();
  return (
    <JobSheetScreen
      bookingId={String(bookingId)}
      onEdit={() => router.push({ pathname: '/schedule/edit/[bookingId]', params: { bookingId: String(bookingId), date: date ?? '' } })}
    />
  );
}
