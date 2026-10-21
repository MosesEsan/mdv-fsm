import { describe, expect, it } from 'vitest';
import { isPasswordRecoveryUrl, webAuthRedirectUrl } from '../authRedirects';

describe('auth redirect URLs', () => {
  it('preserves the hosted web base path', () => {
    expect(webAuthRedirectUrl('/reset-password', 'https://example.com', '/fsm')).toBe('https://example.com/fsm/reset-password');
    expect(webAuthRedirectUrl('set-password', 'http://localhost:8081', '')).toBe('http://localhost:8081/set-password');
  });

  it('recognises Supabase recovery links in hashes and query strings', () => {
    expect(isPasswordRecoveryUrl('https://example.com/fsm#access_token=x&type=recovery')).toBe(true);
    expect(isPasswordRecoveryUrl('https://example.com/fsm/reset-password?type=recovery&code=x')).toBe(true);
    expect(isPasswordRecoveryUrl('https://example.com/fsm#type=invite')).toBe(false);
  });
});
