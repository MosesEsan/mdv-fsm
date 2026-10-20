import { useLocalSearchParams } from 'expo-router';
import { TenantDetailScreen } from '@/core/admin/TenantDetailScreen';

export default function AdminTenant() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  return <TenantDetailScreen key={tenantId} tenantId={String(tenantId)} />;
}
