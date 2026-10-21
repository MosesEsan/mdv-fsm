import { useLocalSearchParams, useRouter } from 'expo-router';
import { InstructionsScreen } from '@/core/jobRecords';

export default function InstructionsRoute() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  return <InstructionsScreen jobId={jobId} onDone={() => router.back()} />;
}
