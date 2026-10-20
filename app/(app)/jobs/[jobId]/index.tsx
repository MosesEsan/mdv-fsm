import { useLocalSearchParams, useRouter } from 'expo-router';
import { JobScreen } from '@/core/jobRecords';

export default function JobRoute() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  return (
    <JobScreen
      jobId={jobId}
      onEdit={() => router.push({ pathname: '/jobs/[jobId]/edit', params: { jobId } })}
      onPost={(stage) => router.push({ pathname: '/jobs/[jobId]/post', params: stage ? { jobId, stage } : { jobId } })}
    />
  );
}
