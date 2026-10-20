import { useRouter } from 'expo-router';
import { ApprovalsScreen } from '@/modules/timesheets/routes';

export default function ApprovalsRoute() {
  const router = useRouter();
  return <ApprovalsScreen onOpenWeek={(weekId) => router.push({ pathname: '/timesheets/approvals/[weekId]', params: { weekId } })} />;
}
