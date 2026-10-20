import { useRouter } from 'expo-router';
import { EnquiriesScreen } from '@/modules/flooring/routes';

export default function EnquiriesRoute() {
  const router = useRouter();
  return (
    <EnquiriesScreen
      onOpen={(jobId) => router.push({ pathname: '/flooring/enquiries/[jobId]', params: { jobId } })}
      onNew={() => router.push('/flooring/enquiries/new')}
    />
  );
}
