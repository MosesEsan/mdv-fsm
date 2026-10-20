import { Image, Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSession } from '@/core/auth/AuthProvider';
import { useBranding } from '@/core/branding';
import { Button, Card, Heading, Loading, Muted, Screen, styles } from '@/core/ui';
import { useModuleNav } from './useModuleNav';

/**
 * Home screen built from the module registry: no module is named here.
 * Shows the business's logo, name and the person's job title from its branding.
 */
export function HomeScreen() {
  const router = useRouter();
  const { claims, isPlatformAdmin, signOut } = useSession();
  const brand = useBranding();
  const { items, isLoading } = useModuleNav();
  const go = (path: string) => router.push(path as Href);

  return (
    <Screen>
      <View style={styles.row}>
        {brand.logoUrl ? <Image source={{ uri: brand.logoUrl }} style={{ width: 48, height: 48 }} resizeMode="contain" accessibilityLabel="Logo" /> : null}
        <View style={{ flex: 1 }}>
          {brand.name ? <Heading>{brand.name}</Heading> : null}
          <Muted>{brand.roleLabel(claims?.role)}</Muted>
        </View>
      </View>
      {isLoading ? <Loading /> : null}
      {items.map((item) => (
        <Pressable key={item.path} accessibilityRole="button" onPress={() => go(item.path)} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}>
          <Heading>{item.title}</Heading>
          {item.description ? <Text style={styles.muted}>{item.description}</Text> : null}
        </Pressable>
      ))}
      {!isLoading && items.length === 0 ? <Muted>Nothing is switched on for your account yet.</Muted> : null}
      <Card>
        {isPlatformAdmin ? <Button title="Platform admin" variant="secondary" onPress={() => go('/admin')} /> : null}
        <Button title="Settings" variant="secondary" onPress={() => go('/settings')} />
        <Button title="Sign out" variant="secondary" onPress={signOut} />
      </Card>
    </Screen>
  );
}
