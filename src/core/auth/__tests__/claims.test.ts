import { describe, expect, it } from 'vitest';
import { isLockedTenantMismatch, type AuthClaims } from '../claims';

const claims: AuthClaims = { userId: 'user', tenantId: 'tenant-a', role: 'owner' };

describe('locked tenant matching', () => {
  it('ignores absent and non-string build config values', () => {
    expect(isLockedTenantMismatch(null, claims)).toBe(false);
    expect(isLockedTenantMismatch({}, claims)).toBe(false);
    expect(isLockedTenantMismatch('', claims)).toBe(false);
  });

  it('only rejects claims for a different explicitly locked tenant', () => {
    expect(isLockedTenantMismatch('tenant-a', claims)).toBe(false);
    expect(isLockedTenantMismatch('tenant-b', claims)).toBe(true);
    expect(isLockedTenantMismatch('tenant-b', null)).toBe(false);
  });
});
