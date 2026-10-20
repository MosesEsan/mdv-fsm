import { useRouter } from 'expo-router';
import { ScheduleScreen } from '@/core/scheduling';

export default function ScheduleRoute() {
  const router = useRouter();
  return (
    <ScheduleScreen
      onOpen={(bookingId, date) => router.push({ pathname: '/schedule/[bookingId]', params: { bookingId, date } })}
      onAdd={(date) => router.push({ pathname: '/schedule/edit/[bookingId]', params: { bookingId: 'new', date } })}
    />
  );
}
