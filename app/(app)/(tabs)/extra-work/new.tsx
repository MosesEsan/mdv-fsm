import { useLocalSearchParams, useRouter } from 'expo-router';
import { NewExtraWorkScreen } from '@/modules/extraWork/routes';

export default function NewExtraWorkRoute() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  return <NewExtraWorkScreen jobId={jobId} onDone={() => router.back()} />;
}
