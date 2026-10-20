import { useLocalSearchParams } from 'expo-router';
import { ViewingScreen } from '@/modules/flooring/routes';

export default function ViewingRoute() {
  const { jobId, title } = useLocalSearchParams<{ jobId: string; title?: string }>();
  return <ViewingScreen key={String(jobId)} jobId={String(jobId)} jobTitle={title ? String(title) : undefined} />;
}
