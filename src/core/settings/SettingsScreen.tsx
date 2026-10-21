import { Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useSession } from '@/core/auth/AuthProvider';
import { useBranding } from '@/core/branding';
import { TabBar, useTabs } from '@/core/modules/TabBar';
import { Button, Card, ErrorText, Screen, colors, styles } from '@/core/ui';
import { AppBar, LoadingCards, SectionLabel } from '@/core/ui/kit';
import { ModuleSettingsSection } from './components/ModuleSettingsSection';
import { getSettingsDefinitions, type SettingsNamespace } from './registry';
import { useTenantSettings } from './useTenantSettings';
import { useUpdateTenantSettings } from './useUpdateTenantSettings';

/**
 * Settings for everyone: who you are, the business, the app version and Sign out.
 * Below that, each switched-on feature's settings, generated from its registered fields (owner can change them).
 */
export function SettingsScreen() {
  const router = useRouter();
  const tabs = useTabs();
  const { session, claims, isPlatformAdmin, signOut } = useSession();
  const brand = useBranding();
  const { settings, isFeatureEnabled, isLoading, error } = useTenantSettings();
  const update = useUpdateTenantSettings();
  const definitions = getSettingsDefinitions().filter((d) => isFeatureEnabled(d.feature));
  const name = typeof session?.user.user_metadata?.full_name === 'string' ? session.user.user_metadata.full_name : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppBar title="Settings" onBack={tabs.length < 2 && router.canGoBack() ? () => router.back() : undefined} />
      <Screen>
        <Card>
          <SectionLabel>You</SectionLabel>
          {name ? <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{name}</Text> : null}
          <Text style={styles.muted}>{[brand.roleLabel(claims?.role), session?.user.email].filter(Boolean).join(' · ')}</Text>
          {brand.name ? <Text style={styles.muted}>{brand.name}</Text> : null}
        </Card>

        {isLoading ? <LoadingCards n={1} /> : null}
        {error ? <ErrorText error={error} /> : null}
        {settings && definitions.length ? (
          <>
            {!update.canEdit ? <Text style={styles.hint}>Only the owner can change these settings.</Text> : null}
            <ErrorText error={update.error} />
            {definitions.map((definition) => (
              <ModuleSettingsSection
                key={definition.namespace}
                definition={definition}
                values={(settings as Record<string, Record<string, unknown>>)[definition.namespace] ?? {}}
                readOnly={!update.canEdit}
                onChange={(key, value) => update.updateModule(definition.namespace as SettingsNamespace, { [key]: value } as never)}
              />
            ))}
          </>
        ) : null}

        {isPlatformAdmin ? <Button title="Platform admin" variant="secondary" onPress={() => router.push('/admin')} /> : null}
        <Button title="Sign out" icon="log-out-outline" variant="secondary" onPress={signOut} />
        <Text style={[styles.hint, { textAlign: 'center' }]}>{`Version ${Constants.expoConfig?.version ?? '–'}`}</Text>
      </Screen>
      <TabBar />
    </View>
  );
}
