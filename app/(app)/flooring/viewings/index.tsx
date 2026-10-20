import { useRouter } from 'expo-router';
import { ViewingsScreen } from '@/modules/flooring/routes';

export default function ViewingsRoute() {
  const router = useRouter();
  return <ViewingsScreen onOpen={(jobId, title) => router.push({ pathname: '/flooring/viewings/[jobId]', params: { jobId, title } })} />;
}
