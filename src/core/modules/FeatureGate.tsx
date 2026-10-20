import type { ReactNode } from 'react';
import { ErrorText, Loading, Muted, Screen } from '@/core/ui';
import { useTenantSettings } from '@/core/settings/useTenantSettings';

/** Renders children only when the tenant has the feature switched on. Wrap each module's routes in it. */
export function FeatureGate({ feature, name, children }: { feature: string; name: string; children: ReactNode }) {
  const { isFeatureEnabled, isLoading, error } = useTenantSettings();
  if (isLoading) return <Loading />;
  if (error) return <Screen><ErrorText error={error} /></Screen>;
  if (!isFeatureEnabled(feature)) return <Screen><Muted>{`${name} isn’t switched on for your business.`}</Muted></Screen>;
  return <>{children}</>;
}
