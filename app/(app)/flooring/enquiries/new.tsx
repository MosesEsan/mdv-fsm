import { useRouter } from 'expo-router';
import { NewEnquiryScreen } from '@/modules/flooring/routes';

export default function NewEnquiryRoute() {
  const router = useRouter();
  return <NewEnquiryScreen onSaved={(jobId) => router.replace({ pathname: '/flooring/enquiries/[jobId]', params: { jobId } })} />;
}
