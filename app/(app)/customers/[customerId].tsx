import { useLocalSearchParams, useRouter } from 'expo-router';
import { CustomerScreen } from '@/core/customers';

export default function CustomerRoute() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const router = useRouter();
  return <CustomerScreen customerId={customerId} onOpenJob={(jobId) => router.push({ pathname: '/jobs/[jobId]', params: { jobId } })} />;
}
