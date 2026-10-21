import { useLocalSearchParams, useRouter } from 'expo-router';
import { JobEditScreen } from '@/core/jobRecords';

export default function EditJobRoute() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  return <JobEditScreen jobId={jobId} onSaved={() => router.back()} />;
}
