import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookingEditScreen } from '@/core/scheduling';

export default function BookingEditRoute() {
  const router = useRouter();
  const { bookingId, date } = useLocalSearchParams<{ bookingId: string; date?: string }>();
  return <BookingEditScreen key={String(bookingId)} bookingId={String(bookingId)} date={String(date ?? '')} onDone={() => router.back()} />;
}
