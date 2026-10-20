import { useLocalSearchParams, useRouter } from 'expo-router';
import { ExtraWorkEntryScreen } from '@/modules/extraWork/routes';

export default function ExtraWorkEntryRoute() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const router = useRouter();
  return (
    <ExtraWorkEntryScreen
      entryId={entryId}
      onOpenJob={(jobId) => router.push({ pathname: '/jobs/[jobId]', params: { jobId } })}
      onDeleted={() => router.back()}
    />
  );
}
