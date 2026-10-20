import { ErrorText, Loading, Muted, Screen } from '@/core/ui';
import { ModuleSettingsSection } from './components/ModuleSettingsSection';
import { getSettingsDefinitions, type SettingsNamespace } from './registry';
import { useTenantSettings } from './useTenantSettings';
import { useUpdateTenantSettings } from './useUpdateTenantSettings';

/**
 * Owner's settings, grouped by module. Only modules switched on in tenants.features appear.
 * Generated from each module's registered field metadata: a new setting needs no screen code.
 */
export function SettingsScreen() {
  const { settings, isFeatureEnabled, isLoading, error } = useTenantSettings();
  const update = useUpdateTenantSettings();

  if (isLoading) return <Loading />;
  if (error || !settings) return <Screen><ErrorText error={error ?? 'Settings could not be loaded'} /></Screen>;

  const definitions = getSettingsDefinitions().filter((d) => isFeatureEnabled(d.feature));

  return (
    <Screen>
      {!update.canEdit ? <Muted>Only the owner can change these settings.</Muted> : null}
      <ErrorText error={update.error} />
      {definitions.length === 0 ? <Muted>No features with settings are switched on.</Muted> : null}
      {definitions.map((definition) => (
        <ModuleSettingsSection
          key={definition.namespace}
          definition={definition}
          values={(settings as Record<string, Record<string, unknown>>)[definition.namespace] ?? {}}
          readOnly={!update.canEdit}
          onChange={(key, value) =>
            update.updateModule(definition.namespace as SettingsNamespace, { [key]: value } as never)
          }
        />
      ))}
    </Screen>
  );
}
