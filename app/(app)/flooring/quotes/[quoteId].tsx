import { useLocalSearchParams, useRouter } from 'expo-router';
import { QuoteScreen } from '@/modules/flooring/routes';

/** /flooring/quotes/new?jobId=… or /flooring/quotes/<id>?jobId=… */
export default function QuoteRoute() {
  const router = useRouter();
  const { quoteId, jobId } = useLocalSearchParams<{ quoteId: string; jobId: string }>();
  const id = quoteId === 'new' ? null : String(quoteId);
  return (
    <QuoteScreen
      key={`${jobId}:${quoteId}`}
      jobId={String(jobId)}
      quoteId={id}
      onCreated={(newId) => router.replace({ pathname: '/flooring/quotes/[quoteId]', params: { quoteId: newId, jobId: String(jobId) } })}
    />
  );
}
