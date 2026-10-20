import { useRouter } from 'expo-router';
import { MyJobsScreen } from '@/core/scheduling';

export default function MyJobsRoute() {
  const router = useRouter();
  return <MyJobsScreen onOpen={(bookingId) => router.push({ pathname: '/my-jobs/[bookingId]', params: { bookingId } })} />;
}
