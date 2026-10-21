// Platform admin data: every call is a platform_* function (checked server-side) or the
// platform-invite Edge Function. Nothing here reads tenant tables directly.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { callFunction } from '@/core/functions';
import { getSupabase } from '@/core/supabase';
import { authRedirectUrl } from '@/core/auth/authRedirectUrl';

export type TenantSummary = {
  id: string; name: string; timezone: string; features: Record<string, unknown>; branding: Record<string, unknown>;
  created_at: string; people: number; active_people: number; owners: number;
};
export type TenantRow = {
  id: string; name: string; timezone: string; features: Record<string, unknown>;
  settings: Record<string, unknown>; branding: Record<string, unknown>; created_at: string;
};
export type Person = {
  id: string; full_name: string; role: string; active: boolean; email: string | null;
  invited_at: string | null; last_sign_in_at: string | null;
};
export type AuditEntry = {
  id: string; created_at: string; action: string; tenant_id: string | null; tenant_name: string | null;
  admin_email: string | null; detail: Record<string, unknown>;
};

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabase().rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const adminKeys = {
  tenants: ['admin', 'tenants'] as const,
  tenant: (id: string) => ['admin', 'tenant', id] as const,
  people: (id: string) => ['admin', 'people', id] as const,
  audit: (id?: string) => ['admin', 'audit', id ?? 'all'] as const,
};

export const useTenants = () => useQuery({ queryKey: adminKeys.tenants, queryFn: () => rpc<TenantSummary[]>('platform_list_tenants') });
export const useAdminTenant = (id: string) =>
  useQuery({ queryKey: adminKeys.tenant(id), queryFn: () => rpc<TenantRow>('platform_get_tenant', { p_tenant: id }) });
export const useTenantPeople = (id: string) =>
  useQuery({ queryKey: adminKeys.people(id), queryFn: () => rpc<Person[]>('platform_tenant_people', { p_tenant: id }) });
export const useAuditLog = (tenantId?: string) =>
  useQuery({ queryKey: adminKeys.audit(tenantId), queryFn: () => rpc<AuditEntry[]>('platform_audit_log', { p_tenant: tenantId ?? null, p_limit: 100 }) });

/** Mutation that refreshes the business, the list and the audit log afterwards. */
function useTenantMutation<V>(tenantId: string | undefined, fn: (v: V) => Promise<unknown>, extra: (readonly unknown[])[] = []) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const key of [adminKeys.tenants, ['admin', 'audit'], ...(tenantId ? [adminKeys.tenant(tenantId)] : []), ...extra]) {
        qc.invalidateQueries({ queryKey: key });
      }
    },
  });
}

export const useCreateTenant = () =>
  useTenantMutation(undefined, (v: { name: string; timezone: string }) =>
    rpc<TenantRow>('platform_create_tenant', { p_name: v.name, p_timezone: v.timezone }));
export const useUpdateTenant = (id: string) =>
  useTenantMutation(id, (v: { name: string; timezone: string }) =>
    rpc<TenantRow>('platform_update_tenant', { p_tenant: id, p_name: v.name, p_timezone: v.timezone }));
export const useSetBranding = (id: string) =>
  useTenantMutation(id, (branding: Record<string, unknown>) => rpc<TenantRow>('platform_set_branding', { p_tenant: id, p_branding: branding }));
export const useSetFeatures = (id: string) =>
  useTenantMutation(id, (features: Record<string, unknown>) => rpc<TenantRow>('platform_set_features', { p_tenant: id, p_features: features }));
export const useSetModuleSettings = (id: string) =>
  useTenantMutation(id, (v: { namespace: string; value: Record<string, unknown> }) =>
    rpc<unknown>('platform_set_module_settings', { p_tenant: id, p_namespace: v.namespace, p_value: v.value }));
export const useInvitePerson = (tenantId: string) =>
  useTenantMutation(tenantId, (v: { email: string; fullName: string; role: string }) =>
    callFunction('platform-invite', { tenantId, ...v, redirectTo: authRedirectUrl('/set-password') }, 'The invite could not be sent. Please try again.'),
  [adminKeys.people(tenantId)]);
export const useUpdatePerson = (tenantId: string) =>
  useTenantMutation(tenantId, (v: { userId: string; fullName: string; role: string; active: boolean }) =>
    rpc<unknown>('platform_update_member', { p_user: v.userId, p_full_name: v.fullName, p_role: v.role, p_active: v.active }),
  [adminKeys.people(tenantId)]);
