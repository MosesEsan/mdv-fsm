import { describe, expect, it } from 'vitest';
import { periodFor, periodProblem } from '../periods';

describe('report periods', () => {
  const today = '2026-10-21'; // a Wednesday
  it('week presets follow the tenant week start', () => {
    expect(periodFor('this_week', today, 'monday')).toEqual({ from: '2026-10-19', to: '2026-10-25' });
    expect(periodFor('last_week', today, 'monday')).toEqual({ from: '2026-10-12', to: '2026-10-18' });
    expect(periodFor('last_week', today, 'sunday')).toEqual({ from: '2026-10-11', to: '2026-10-17' });
    expect(periodFor('last_4_weeks', today, 'monday')).toEqual({ from: '2026-09-21', to: '2026-10-18' });
  });
  it('month presets are calendar months, including year ends and February', () => {
    expect(periodFor('this_month', today, 'monday')).toEqual({ from: '2026-10-01', to: '2026-10-31' });
    expect(periodFor('last_month', '2027-01-15', 'monday')).toEqual({ from: '2026-12-01', to: '2026-12-31' });
    expect(periodFor('this_month', '2028-02-10', 'monday')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });
  it('custom period checks', () => {
    expect(periodProblem({ from: '2026-10-05', to: '2026-10-11' })).toBe(null);
    expect(periodProblem({ from: '05/10/2026', to: '2026-10-11' })).toContain('Enter dates');
    expect(periodProblem({ from: '2026-10-11', to: '2026-10-05' })).toContain('before');
    expect(periodProblem({ from: '2025-01-01', to: '2026-10-05' })).toContain('year');
  });
});
