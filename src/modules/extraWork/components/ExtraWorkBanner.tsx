import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { isManagerRole } from '@/core/auth/claims';
import { useAuthClaims } from '@/core/auth/useAuthClaims';
import { colors } from '@/core/ui';
import { useOpenCounts } from '../hooks';

/** Above the jobs list, for the owner and manager: extra work still to go on an invoice. */
export function ExtraWorkBanner() {
  const router = useRouter();
  const isManager = isManagerRole(useAuthClaims()?.role);
  const counts = useOpenCounts();
  const total = Object.values(counts.data ?? {}).reduce((a, b) => a + b, 0);
  if (!isManager || !total) return null;
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/extra-work')}
      style={({ pressed }) => ({ flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderWidth: 1, borderColor: colors.danger, backgroundColor: '#FFEBE9', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, opacity: pressed ? 0.8 : 1 })}>
      <Ionicons name="flag" size={20} color={colors.danger} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#82071E' }}>{`${total} extra work ${total === 1 ? 'entry' : 'entries'} to add to invoices`}</Text>
        <Text style={{ fontSize: 15, color: '#82071E' }}>Tap to see them all</Text>
      </View>
    </Pressable>
  );
}
