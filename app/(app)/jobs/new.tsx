import { useRouter } from 'expo-router';
import { JobEditScreen } from '@/core/jobRecords';

export default function NewJobRoute() {
  const router = useRouter();
  return <JobEditScreen jobId={null} onSaved={(jobId) => router.replace({ pathname: '/jobs/[jobId]', params: { jobId } })} />;
}
