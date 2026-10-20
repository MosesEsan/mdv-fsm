// Pure request check for platform-invite (unit-tested).
export const ROLES = ['owner', 'manager', 'supervisor', 'worker', 'fitter'] as const;
export type Role = (typeof ROLES)[number];
export type InviteRequest = { tenantId: string; email: string; fullName: string; role: Role; redirectTo?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInvite(body: unknown): InviteRequest | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Invalid request' };
  const b = body as Record<string, unknown>;
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  const fullName = typeof b.fullName === 'string' ? b.fullName.trim() : '';
  if (typeof b.tenantId !== 'string' || !UUID.test(b.tenantId)) return { error: 'Pick a business' };
  if (!EMAIL.test(email) || email.length > 254) return { error: 'Enter a valid email address' };
  if (fullName.length < 1 || fullName.length > 120) return { error: 'Enter their name' };
  if (!ROLES.includes(b.role as Role)) return { error: 'Pick a role' };
  // Optional: where the email link lands. Supabase Auth only honours URLs on its allow-list.
  const redirectTo = typeof b.redirectTo === 'string' && /^https?:\/\/[^\s]+$/.test(b.redirectTo) ? b.redirectTo : undefined;
  return { tenantId: b.tenantId, email, fullName, role: b.role as Role, ...(redirectTo ? { redirectTo } : {}) };
}
