import { describe, expect, it } from 'vitest';
import { navFor, type ModuleDefinition } from '../registry';

const modules: ModuleDefinition[] = [
  {
    id: 'timesheets', feature: 'timesheets', title: 'Timesheets',
    nav: [
      { path: '/timesheets', title: 'My hours', roles: 'all', order: 10 },
      { path: '/timesheets/approvals', title: 'Sign-offs', roles: ['owner', 'manager', 'supervisor'], order: 11 },
      { path: '/timesheets/reports', title: 'Hours & export', roles: ['owner', 'manager'], order: 12 },
    ],
  },
  { id: 'quotes', feature: 'quotes', title: 'Quotes', nav: [{ path: '/quotes', title: 'Quotes', roles: ['owner'], order: 5 }] },
];

const on = (...keys: string[]) => (f: string) => keys.includes(f);

describe('module menu', () => {
  it('shows entries for the role, from switched-on modules only, in order', () => {
    expect(navFor('owner', on('timesheets', 'quotes'), modules).map((i) => i.title)).toEqual(['Quotes', 'My hours', 'Sign-offs', 'Hours & export']);
    expect(navFor('owner', on('timesheets'), modules).map((i) => i.title)).toEqual(['My hours', 'Sign-offs', 'Hours & export']);
  });
  it('filters by role', () => {
    expect(navFor('supervisor', on('timesheets'), modules).map((i) => i.title)).toEqual(['My hours', 'Sign-offs']);
    expect(navFor('worker', on('timesheets', 'quotes'), modules).map((i) => i.title)).toEqual(['My hours']);
  });
  it('shows nothing when signed out or nothing is switched on', () => {
    expect(navFor(undefined, on('timesheets'), modules)).toEqual([]);
    expect(navFor('owner', on(), modules)).toEqual([]);
  });
  it('hides entries whose settings rule says no', () => {
    const list = [{ id: 'x', feature: 'x', title: 'X', nav: [
      { path: '/a', title: 'Weekly', roles: 'all' as const, when: (st: Record<string, unknown> | undefined) => st?.mode !== 'visits' },
      { path: '/b', title: 'Visits', roles: 'all' as const, when: (st: Record<string, unknown> | undefined) => st?.mode === 'visits' },
    ] }];
    expect(navFor('worker', on('x'), list, { mode: 'visits' }).map((i) => i.title)).toEqual(['Visits']);
    expect(navFor('worker', on('x'), list, {}).map((i) => i.title)).toEqual(['Weekly']);
  });
});
