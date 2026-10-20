import { describe, expect, it } from 'vitest';
import { validateInvite } from './invite.ts';

const ok = { tenantId: '0b5c2c3e-1111-4222-8333-444455556666', email: ' Mary@Example.IE ', fullName: ' Mary Byrne ', role: 'owner' };

describe('invite request', () => {
  it('accepts and tidies a valid request', () => {
    expect(validateInvite(ok)).toEqual({ tenantId: ok.tenantId, email: 'mary@example.ie', fullName: 'Mary Byrne', role: 'owner' });
  });
  it('rejects bad input with plain messages', () => {
    expect(validateInvite({ ...ok, tenantId: 'x' })).toEqual({ error: 'Pick a business' });
    expect(validateInvite({ ...ok, email: 'mary@' })).toEqual({ error: 'Enter a valid email address' });
    expect(validateInvite({ ...ok, fullName: '  ' })).toEqual({ error: 'Enter their name' });
    expect(validateInvite({ ...ok, role: 'admin' })).toEqual({ error: 'Pick a role' });
    expect(validateInvite(null)).toEqual({ error: 'Invalid request' });
  });
  it('keeps a web redirect link and ignores anything else', () => {
    expect(validateInvite({ ...ok, redirectTo: 'http://localhost:8081/set-password' })).toMatchObject({ redirectTo: 'http://localhost:8081/set-password' });
    expect('redirectTo' in (validateInvite({ ...ok, redirectTo: 'javascript:alert(1)' }) as object)).toBe(false);
  });
});
