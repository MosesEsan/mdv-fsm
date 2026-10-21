import { useLocalSearchParams, useRouter } from 'expo-router';
import { CustomerReportScreen, TimesheetsGate } from '@/modules/timesheets/routes';

export default function CustomerReportRoute() {
  const router = useRouter();
  const { customer, month } = useLocalSearchParams<{ customer?: string; month?: string }>();
  return <TimesheetsGate><CustomerReportScreen initialCustomer={customer} initialMonth={month}
    onOpen={(id) => router.push({ pathname: '/visit/[id]', params: { id } })} /></TimesheetsGate>;
}
