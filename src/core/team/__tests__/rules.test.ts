import { describe, expect, it } from 'vitest';
import { inviteProblems, memberStatus, teamRoleOptions } from '../rules';

describe('team rules', () => {
  it('offers roles that fit the business', () => {
    expect(teamRoleOptions(() => false)).toEqual(['manager', 'worker']);
    expect(teamRoleOptions((f) => f === 'flooring')).toEqual(['manager', 'worker', 'fitter']);
    expect(teamRoleOptions((f) => f === 'timesheets')).toEqual(['manager', 'supervisor', 'worker']);
  });
  it('lists what is missing from an invite', () => {
    expect(inviteProblems({ name: '', email: 'x', role: null })).toEqual(['Enter their name.', 'Enter a valid email address.', 'Pick what they do.']);
    expect(inviteProblems({ name: 'Adam', email: 'adam@example.ie', role: 'worker' })).toEqual([]);
  });
  it('says who is still to sign in or switched off', () => {
    const m = { id: '1', full_name: 'A', role: 'worker', email: 'a@x.ie', active: true, signed_in: true };
    expect(memberStatus(m)).toBeNull();
    expect(memberStatus({ ...m, signed_in: false })).toEqual({ label: 'Invite sent', tone: 'amber' });
    expect(memberStatus({ ...m, active: false })).toEqual({ label: 'Access off', tone: 'grey' });
  });
});
