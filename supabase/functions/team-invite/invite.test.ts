import { describe, expect, it } from 'vitest';
import { validateTeamInvite } from './invite.ts';

const ok = { email: ' Adam@Example.IE ', fullName: ' Adam Byrne ', role: 'worker' };

describe('team invite request', () => {
  it('accepts and tidies a valid request', () => {
    expect(validateTeamInvite(ok)).toEqual({ email: 'adam@example.ie', fullName: 'Adam Byrne', role: 'worker' });
  });
  it('keeps an app link for the email', () => {
    expect(validateTeamInvite({ ...ok, redirectTo: 'field-service://set-password' })).toMatchObject({ redirectTo: 'field-service://set-password' });
  });
  it('never lets the app create an owner', () => {
    expect(validateTeamInvite({ ...ok, role: 'owner' })).toEqual({ error: 'Pick a role' });
  });
  it('rejects bad input with plain messages', () => {
    expect(validateTeamInvite({ ...ok, fullName: ' ' })).toEqual({ error: 'Enter their name' });
    expect(validateTeamInvite({ ...ok, email: 'adam@' })).toEqual({ error: 'Enter a valid email address' });
    expect(validateTeamInvite(null)).toEqual({ error: 'Invalid request' });
  });
});
