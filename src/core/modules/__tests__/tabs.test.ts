import { describe, expect, it } from 'vitest';
import { activeTab } from '../tabs';

const tabs = [{ path: '/jobs', title: 'Jobs', roles: 'all' as const }, { path: '/timesheets/visits', title: 'Today', roles: 'all' as const },
  { path: '/timesheets/visits/entries', title: 'Entries', roles: 'all' as const }];

describe('tab bar', () => {
  it('shows on a tab\'s first screen and marks it', () => {
    expect(activeTab(tabs, '/jobs')?.title).toBe('Jobs');
    expect(activeTab(tabs, '/timesheets/visits/entries/')?.title).toBe('Entries');
    expect(activeTab(tabs, '/timesheets/visits')?.title).toBe('Today');
  });
  it('hides on screens inside a tab', () => {
    expect(activeTab(tabs, '/jobs/123')).toBe(undefined);
    expect(activeTab(tabs, '/timesheets/visits/abc')).toBe(undefined);
  });
});
