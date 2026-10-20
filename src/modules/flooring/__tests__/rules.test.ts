import { describe, expect, it } from 'vitest';
import { parseMetres, previewArea, roomProblems, roomValues, totalArea } from '../rules';

const room = (p: Partial<{ name: string; length: string; width: string; area: string }>) =>
  ({ name: 'Kitchen', length: '', width: '', area: '', floorType: '', notes: '', ...p });

describe('flooring measurements', () => {
  it('reads metres the way people type them', () => {
    expect(parseMetres('4,2')).toBe(4.2);
    expect(parseMetres(' 3.50 m')).toBe(3.5);
    expect(parseMetres('')).toBeNull();
    expect(Number.isNaN(parseMetres('four') as number)).toBe(true);
  });
  it('works out the area like the database', () => {
    expect(previewArea(room({ length: '4.2', width: '3,5' }))).toBe(14.7);
    expect(previewArea(room({ area: '9.4' }))).toBe(9.4);
    expect(roomValues(room({ length: '4.2', width: '3.5', area: '99' })).area_m2).toBe(14.7);
    expect(totalArea([{ area_m2: 14.7 }, { area_m2: 9.4 }, { area_m2: null }])).toBe(24.1);
  });
  it('explains problems in plain English', () => {
    expect(roomProblems(room({ length: '4.2', width: '3.5' }))).toEqual([]);
    expect(roomProblems(room({ name: ' ', length: '4.2' }))).toEqual(['Give the room a name', 'Enter both length and width, or just the area']);
    expect(roomProblems(room({ area: 'big' }))[0]).toContain('number like 4.2');
  });
});
