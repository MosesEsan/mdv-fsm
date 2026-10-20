import { describe, expect, it } from 'vitest';
import { emptyExtraForm, extraDetailLine, extraProblems, extraValues, parseHours } from '../rules';

describe('extra work rules', () => {
  it('parses hours with a dot or comma', () => {
    expect(parseHours('1.5')).toBe(1.5);
    expect(parseHours('1,5')).toBe(1.5);
    expect(parseHours('')).toBeNull();
    expect(parseHours('abc')).toBeNaN();
  });
  it('needs what, and sensible hours', () => {
    expect(extraProblems(emptyExtraForm())).toEqual(['Say what the extra work was']);
    expect(extraProblems({ ...emptyExtraForm(), what: 'Joist', hours: '30' })).toHaveLength(1);
    expect(extraProblems({ ...emptyExtraForm(), what: 'Joist', hours: '2' })).toEqual([]);
  });
  it('trims values and blanks become null', () => {
    expect(extraValues({ what: ' Joist ', why: ' ', hours: '2', materials: '' })).toEqual({ what: 'Joist', why: null, hours: 2, materials: null });
  });
  it('builds the detail line', () => {
    expect(extraDetailLine({ hours: 1, materials: 'Copper pipe' })).toBe('1 hr · Copper pipe');
    expect(extraDetailLine({ hours: null, materials: null })).toBe('');
  });
});
