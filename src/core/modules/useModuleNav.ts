import { useAuthClaims } from '@/core/auth/useAuthClaims';
import { useTenantSettings } from '@/core/settings/useTenantSettings';
import { navFor } from './registry';

/** Menu entries the signed-in person should see, from every registered module that's switched on. */
export function useModuleNav() {
  const claims = useAuthClaims();
  const { isFeatureEnabled, isLoading, settings } = useTenantSettings();
  return { items: navFor(claims?.role, isFeatureEnabled, undefined, settings as Record<string, unknown> | undefined), isLoading };
}
