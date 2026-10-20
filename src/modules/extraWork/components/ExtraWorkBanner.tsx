import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { isManagerRole } from '@/core/auth/claims';
import { useAuthClaims } from '@/core/auth/useAuthClaims';
import { Card, Muted, styles } from '@/core/ui';
import { useOpenCounts } from '../hooks';

/** Above the jobs list, for the office: how much extra work is waiting to be invoiced. */
export function ExtraWorkBanner() {
  const router = useRouter();
  const isManager = isManagerRole(useAuthClaims()?.role);
  const counts = useOpenCounts();
  const total = Object.values(counts.data ?? {}).reduce((a, b) => a + b, 0);
  if (!isManager || !total) return null;
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/extra-work')}>
      <Card>
        <Text style={styles.label}>{`${total} extra work item${total === 1 ? '' : 's'} to invoice`}</Text>
        <Muted>Tap to see them and tick them off once they're on an invoice.</Muted>
      </Card>
    </Pressable>
  );
}
