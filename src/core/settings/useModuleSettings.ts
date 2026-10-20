import type { ModuleSettingsMap, SettingsNamespace } from './registry';
import { useTenantSettings } from './useTenantSettings';

export function useModuleSettings<N extends SettingsNamespace>(namespace: N) {
  const query = useTenantSettings();
  return {
    settings: query.settings?.[namespace] as ModuleSettingsMap[N] | undefined,
    timezone: query.timezone,
    enabled: query.isFeatureEnabled(namespace),
    isLoading: query.isLoading,
    error: query.error,
  };
}
