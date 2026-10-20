// Claims added to the access token by the custom access token hook.
// The role claim is `app_role` because Supabase reserves `role`.

export type AppRole = 'owner' | 'manager' | 'supervisor' | (string & {});

export type AuthClaims = {
  userId: string;
  tenantId: string;
  role: AppRole;
};

export const isOwnerRole = (role: AppRole | undefined): boolean => role === 'owner';
export const isManagerRole = (role: AppRole | undefined): boolean => role === 'owner' || role === 'manager';
export const isSupervisorRole = (role: AppRole | undefined): boolean => role === 'supervisor';

/** Expo may deserialize a null `extra` value as an object; only a non-empty string locks a build. */
export function isLockedTenantMismatch(lockedTenantId: unknown, claims: AuthClaims | null): boolean {
  return typeof lockedTenantId === 'string'
    && lockedTenantId.length > 0
    && claims !== null
    && claims.tenantId !== lockedTenantId;
}

function base64UrlDecode(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  return decodeURIComponent(
    Array.from(atob(b64), (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
  );
}

function tokenPayload(token: string | undefined | null): Record<string, unknown> | null {
  if (!token) return null;
  try {
    return JSON.parse(base64UrlDecode(token.split('.')[1] ?? ''));
  } catch {
    return null;
  }
}

/** Reads our claims from an access token. Display/routing only: the database re-checks everything. */
export function claimsFromAccessToken(token: string | undefined | null): AuthClaims | null {
  const payload = tokenPayload(token);
  if (!payload || typeof payload.sub !== 'string' || typeof payload.tenant_id !== 'string') return null;
  return { userId: payload.sub, tenantId: payload.tenant_id, role: (payload.app_role as AppRole) ?? 'worker' };
}

/** Platform team member (may belong to no business). Routing only: platform functions re-check in the database. */
export function platformAdminFromAccessToken(token: string | undefined | null): boolean {
  return tokenPayload(token)?.platform_admin === true;
}
