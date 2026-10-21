// Pure rules for the Team screen (unit-tested). The database checks the same things.
export const TEAM_ROLES = ['manager', 'supervisor', 'worker', 'fitter', 'viewer'] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Roles the owner can give, depending on what the business uses. Owners are set up by us. */
export function teamRoleOptions(isFeatureEnabled: (feature: string) => boolean): TeamRole[] {
  return TEAM_ROLES.filter((r) => r === 'manager' || r === 'worker'
    || (r === 'supervisor' && isFeatureEnabled('timesheets'))
    || (r === 'fitter' && isFeatureEnabled('flooring'))
    || (r === 'viewer' && isFeatureEnabled('timesheets')));
}

export function inviteProblems(v: { name: string; email: string; role: string | null }): string[] {
  const out: string[] = [];
  if (!v.name.trim()) out.push('Enter their name.');
  if (!EMAIL.test(v.email.trim())) out.push('Enter a valid email address.');
  if (!v.role) out.push('Pick what they do.');
  return out;
}

export type Member = { id: string; full_name: string | null; role: string; active: boolean; email: string | null; signed_in: boolean };

/** The small status under a person's name. */
export function memberStatus(m: Member): { label: string; tone: 'grey' | 'amber' } | null {
  if (!m.active) return { label: 'Access off', tone: 'grey' };
  if (!m.signed_in) return { label: 'Invite sent', tone: 'amber' };
  return null;
}
