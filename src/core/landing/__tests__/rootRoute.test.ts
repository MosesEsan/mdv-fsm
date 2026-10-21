import { describe, expect, it } from 'vitest';
import { shouldShowLandingPage } from '../rootRoute';

describe('shouldShowLandingPage', () => {
  it('shows the marketing page on the web', () => {
    expect(shouldShowLandingPage('web')).toBe(true);
  });

  it.each(['ios', 'android'])('sends %s users directly to authentication', (platform) => {
    expect(shouldShowLandingPage(platform)).toBe(false);
  });
});
