import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { Muted, Screen } from '@/core/ui';

/** Platform admin (our team only; the root Guard checks the platform claim). Web build only. */
export default function AdminLayout() {
  if (Platform.OS !== 'web') {
    return <Screen><Muted>The platform admin opens on a computer. Use the web address in a browser.</Muted></Screen>;
  }
  return (
    <View style={{ flex: 1, width: '100%', maxWidth: 960, alignSelf: 'center' }}>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
