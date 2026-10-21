import { useRouter } from 'expo-router';
import { JobsScreen } from '@/core/jobRecords';

export default function JobsRoute() {
  const router = useRouter();
  return (
    <JobsScreen
      onOpen={(jobId) => router.push({ pathname: '/jobs/[jobId]', params: { jobId } })}
      onNew={() => router.push('/jobs/new')}
    />
  );
}
