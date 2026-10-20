import { getSupabase, unwrap } from '@/core/supabase';
import { parseBranding, type Branding } from '@/core/branding/schema';
import { parseTenantSettings, type TenantSettings } from './schema';

export type TenantSettingsData = {
  tenantId: string;
  name: string;
  timezone: string;
  branding: Branding;
  features: Record<string, unknown>;
  settings: TenantSettings;
};

type TenantRow = {
  id: string;
  name?: string | null;
  branding?: unknown;
  timezone: string | null;
  features: Record<string, unknown> | null;
  settings: unknown;
};

export const tenantSettingsKey = (tenantId: string | undefined) => ['tenant-settings', tenantId ?? 'none'] as const;

export function toTenantSettingsData(row: TenantRow): TenantSettingsData {
  return {
    tenantId: row.id,
    name: row.name ?? '',
    timezone: row.timezone ?? 'Europe/Dublin',
    branding: parseBranding(row.branding),
    features: row.features ?? {},
    settings: parseTenantSettings(row.settings),
  };
}

export async function fetchTenantSettings(tenantId: string): Promise<TenantSettingsData> {
  const row = unwrap(
    await getSupabase().from('tenants').select('id, name, timezone, features, settings, branding').eq('id', tenantId).single(),
  ) as TenantRow;
  return toTenantSettingsData(row);
}

/** Owner only. The server validates the value and returns the tenant's full stored settings. */
export async function saveModuleSettings(namespace: string, value: unknown): Promise<unknown> {
  return unwrap(
    await getSupabase().rpc('update_tenant_settings', { p_namespace: namespace, p_value: value }),
  );
}
