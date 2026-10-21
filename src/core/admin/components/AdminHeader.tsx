import { Text, View } from 'react-native';
import { useSession } from '@/core/auth/AuthProvider';
import { Button, colors } from '@/core/ui';

export function AdminHeader() {
  const { session, signOut } = useSession();
  return (
    <View style={{ minHeight: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <View>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 17 }}>Platform admin</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>{session?.user.email ?? ''}</Text>
      </View>
      <Button title="Sign out" variant="secondary" size="sm" onPress={() => void signOut()} />
    </View>
  );
}
