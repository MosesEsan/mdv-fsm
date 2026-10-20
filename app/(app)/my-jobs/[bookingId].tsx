import { useLocalSearchParams } from 'expo-router';
import { JobSheetScreen } from '@/core/scheduling';

export default function MyJobSheetRoute() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  return <JobSheetScreen bookingId={String(bookingId)} />;
}
