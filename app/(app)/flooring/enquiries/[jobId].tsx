import { useLocalSearchParams, useRouter } from 'expo-router';
import { EnquiryScreen } from '@/modules/flooring/routes';

export default function EnquiryRoute() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const id = String(jobId);
  return (
    <EnquiryScreen
      key={id}
      jobId={id}
      onOpenViewing={() => router.push({ pathname: '/flooring/viewings/[jobId]', params: { jobId: id } })}
      onBookWork={() => router.push({ pathname: '/schedule/edit/[bookingId]', params: { bookingId: 'new', jobId: id, date: '' } })}
    />
  );
}
