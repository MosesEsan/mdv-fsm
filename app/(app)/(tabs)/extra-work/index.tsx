import { useRouter } from 'expo-router';
import { ExtraWorkListScreen } from '@/modules/extraWork/routes';

export default function ExtraWorkRoute() {
  const router = useRouter();
  return <ExtraWorkListScreen onOpen={(entryId) => router.push({ pathname: '/extra-work/[entryId]', params: { entryId } })} />;
}
