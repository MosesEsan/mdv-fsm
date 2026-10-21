// Pure request check for team-invite (unit-tested).
export const TEAM_ROLES = ['manager', 'supervisor', 'worker', 'fitter', 'viewer'] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];
export type TeamInvite = { email: string; fullName: string; role: TeamRole; redirectTo?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateTeamInvite(body: unknown): TeamInvite | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Invalid request' };
  const b = body as Record<string, unknown>;
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  const fullName = typeof b.fullName === 'string' ? b.fullName.trim() : '';
  if (fullName.length < 1 || fullName.length > 120) return { error: 'Enter their name' };
  if (!EMAIL.test(email) || email.length > 254) return { error: 'Enter a valid email address' };
  if (!TEAM_ROLES.includes(b.role as TeamRole)) return { error: 'Pick a role' };
  // Where the email link lands (the app's set-password screen). Supabase only honours allow-listed URLs.
  const redirectTo = typeof b.redirectTo === 'string' && /^[a-z][a-z0-9+.-]*:\/\/\S+$/i.test(b.redirectTo) ? b.redirectTo : undefined;
  return { email, fullName, role: b.role as TeamRole, ...(redirectTo ? { redirectTo } : {}) };
}
