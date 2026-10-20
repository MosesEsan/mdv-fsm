import { Switch, Text, View } from 'react-native';
import { isFeatureEnabled } from '@/core/features';
import { getModules } from '@/core/modules/registry';
import { ModuleSettingsSection } from '@/core/settings/components/ModuleSettingsSection';
import { getSettingsDefinitions } from '@/core/settings/registry';
import { parseTenantSettings } from '@/core/settings/schema';
import { Card, ErrorText, Heading, Muted, styles } from '@/core/ui';
import { useSetFeatures, useSetModuleSettings, type TenantRow } from '../api';
import { toggleFeature } from '../features';

/** Switch modules on/off for a business and set their options (the same fields the owner sees). */
export function ModulesSection({ tenant }: { tenant: TenantRow }) {
  const setFeatures = useSetFeatures(tenant.id);
  const setSettings = useSetModuleSettings(tenant.id);
  const settings = parseTenantSettings(tenant.settings) as Record<string, Record<string, unknown>>;
  const modules = getModules();
  const definitions = getSettingsDefinitions().filter((d) => isFeatureEnabled(tenant.features, d.feature));

  return (
    <>
      <Card>
        <Heading>Modules</Heading>
        {modules.length === 0 ? <Muted>No modules are installed in this build.</Muted> : null}
        {modules.map((m) => (
          <View key={m.id} style={[styles.row, { justifyContent: 'space-between' }]}>
            <Text style={styles.label}>{m.title}</Text>
            <Switch accessibilityLabel={m.title} value={isFeatureEnabled(tenant.features, m.feature)} disabled={setFeatures.isPending}
              onValueChange={(on) => setFeatures.mutate(toggleFeature(tenant.features, m.feature, on))} />
          </View>
        ))}
        <ErrorText error={setFeatures.error} />
      </Card>
      <ErrorText error={setSettings.error} />
      {definitions.map((d) => (
        <ModuleSettingsSection key={d.namespace} definition={d} readOnly={setSettings.isPending}
          values={settings[d.namespace] ?? {}}
          onChange={(key, value) => setSettings.mutate({ namespace: d.namespace, value: { ...((tenant.settings?.[d.namespace] as object) ?? {}), [key]: value } })} />
      ))}
    </>
  );
}
