import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookingEditScreen } from '@/core/scheduling';

export default function BookingEditRoute() {
  const router = useRouter();
  const { bookingId, date, jobId } = useLocalSearchParams<{ bookingId: string; date?: string; jobId?: string }>();
  return <BookingEditScreen key={String(bookingId)} bookingId={String(bookingId)} date={String(date ?? '')} jobId={jobId ? String(jobId) : undefined} onDone={() => router.back()} />;
}
