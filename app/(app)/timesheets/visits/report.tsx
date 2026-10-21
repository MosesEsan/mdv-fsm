import { useLocalSearchParams, useRouter } from 'expo-router';
import { CustomerReportScreen } from '@/modules/timesheets/routes';

export default function CustomerReportRoute() {
  const router = useRouter();
  const { customer, month } = useLocalSearchParams<{ customer?: string; month?: string }>();
  return <CustomerReportScreen initialCustomer={customer} initialMonth={month}
    onOpen={(id) => router.push({ pathname: '/timesheets/visits/[id]', params: { id } })} />;
}
