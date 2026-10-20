import { Text, View } from 'react-native';
import { Card, ErrorText, Heading, Loading, Muted, styles } from '@/core/ui';
import { useAuditLog } from '../api';

const ACTIONS: Record<string, string> = {
  tenant_created: 'Business created', tenant_updated: 'Details changed', branding_set: 'Branding changed',
  features_set: 'Modules changed', settings_set: 'Module settings changed', member_added: 'Person added', member_updated: 'Person changed',
};

/** Every change the platform team made to this business (read-only). */
export function AuditSection({ tenantId }: { tenantId: string }) {
  const log = useAuditLog(tenantId);
  return (
    <Card>
      <Heading>History</Heading>
      {log.isLoading ? <Loading /> : null}
      <ErrorText error={log.error} />
      {(log.data ?? []).map((e) => (
        <View key={e.id} style={{ paddingVertical: 4 }}>
          <Text style={styles.label}>{ACTIONS[e.action] ?? e.action}</Text>
          <Text style={styles.muted}>{`${e.created_at.slice(0, 16).replace('T', ' ')} · ${e.admin_email ?? 'unknown'}`}</Text>
        </View>
      ))}
      {log.data?.length === 0 ? <Muted>No changes yet.</Muted> : null}
    </Card>
  );
}
