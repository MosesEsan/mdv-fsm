import { useRouter } from 'expo-router';
import { MyWeekScreen } from '@/modules/timesheets/routes';

export default function MyHoursRoute() {
  const router = useRouter();
  return <MyWeekScreen onOpenDay={(date) => router.push({ pathname: '/timesheets/day/[date]', params: { date } })} />;
}
