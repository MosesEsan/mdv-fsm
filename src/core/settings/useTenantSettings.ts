import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthClaims } from '@/core/auth/useAuthClaims';
import { isFeatureEnabled } from '@/core/features';
import { fetchTenantSettings, tenantSettingsKey } from './api';

/** Typed tenant settings with defaults applied. `settings` is undefined until loaded. */
export function useTenantSettings() {
  const claims = useAuthClaims();
  const tenantId = claims?.tenantId;

  const query = useQuery({
    queryKey: tenantSettingsKey(tenantId),
    queryFn: () => fetchTenantSettings(tenantId as string),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60_000, // Realtime + app focus keep it fresh (see useTenantSettingsSync)
  });

  const features = query.data?.features;
  const featureEnabled = useCallback((key: string) => isFeatureEnabled(features, key), [features]);

  return {
    ...query,
    settings: query.data?.settings,
    timezone: query.data?.timezone,
    isFeatureEnabled: featureEnabled,
  };
}
