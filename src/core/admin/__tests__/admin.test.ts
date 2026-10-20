import { describe, expect, it } from 'vitest';
import { toggleFeature } from '../features';
import { logoPathFor, logoProblem } from '../logoRules';

describe('admin helpers', () => {
  it('toggles one module and keeps the rest', () => {
    expect(toggleFeature({ a: true, b: { enabled: false } }, 'b', true)).toEqual({ a: true, b: true });
    expect(toggleFeature(null, 'a', false)).toEqual({ a: false });
    expect(toggleFeature({ a: { enabled: true } }, 'a', true)).toEqual({ a: { enabled: true } });
  });
  it('checks logo files and builds the stored path inside the business folder', () => {
    expect(logoProblem({ type: 'image/png', size: 1000 })).toBeNull();
    expect(logoProblem({ type: 'image/gif', size: 1000 })).toContain('PNG');
    expect(logoProblem({ type: 'image/png', size: 2_000_000 })).toContain('1 MB');
    expect(logoPathFor('t1', 'image/jpeg', 'x')).toBe('t1/logo/x.jpg');
  });
});
