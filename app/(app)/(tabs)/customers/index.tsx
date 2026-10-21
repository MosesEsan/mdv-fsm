import { useRouter } from 'expo-router';
import { CustomersScreen } from '@/core/customers';

export default function CustomersRoute() {
  const router = useRouter();
  return <CustomersScreen onOpen={(customerId) => router.push({ pathname: '/customers/[customerId]', params: { customerId } })} />;
}
