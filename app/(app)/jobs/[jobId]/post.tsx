import { useLocalSearchParams, useRouter } from 'expo-router';
import { PostUpdateScreen } from '@/core/jobRecords';

export default function PostUpdateRoute() {
  const { jobId, stage } = useLocalSearchParams<{ jobId: string; stage?: string }>();
  const router = useRouter();
  return <PostUpdateScreen jobId={jobId} initialStage={stage === 'completion' ? 'completion' : 'progress'} onDone={() => router.back()} />;
}
