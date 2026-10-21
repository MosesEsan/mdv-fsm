import { describe, expect, it } from 'vitest';
import { tabRouteName } from '../tabs';

describe('tab routes', () => {
  it('maps a menu path to its tab route', () => {
    expect(tabRouteName('/jobs')).toBe('jobs');
    expect(tabRouteName('/visit-entries/')).toBe('visit-entries');
    expect(tabRouteName('/')).toBe('index');
  });
});
