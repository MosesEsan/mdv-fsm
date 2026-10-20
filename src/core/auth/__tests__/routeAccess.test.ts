import { describe, expect, it } from 'vitest';
import { isPublicRoute } from '../routeAccess';

describe('isPublicRoute', () => {
  it('allows the root landing route', () => {
    expect(isPublicRoute([])).toBe(true);
    expect(isPublicRoute(['index'])).toBe(true);
  });

  it('keeps authentication and application routes protected', () => {
    expect(isPublicRoute(['(auth)', 'login'])).toBe(false);
    expect(isPublicRoute(['admin'])).toBe(false);
    expect(isPublicRoute(['(app)', 'jobs'])).toBe(false);
  });
});
