import { describe, expect, it } from 'vitest';
import { brandingProblems, contrastWithWhite, parseBranding, roleLabel } from '../schema';

describe('branding', () => {
  it('contrast against white matches WCAG (and the SQL check)', () => {
    expect(contrastWithWhite('#000000')).toBe(21);
    expect(contrastWithWhite('#FFFFFF')).toBe(1);
    expect(contrastWithWhite('#1F4E79')).toBeGreaterThan(4.5);
    expect(contrastWithWhite('#FFD700')).toBeLessThan(4.5);
  });
  it('flags colours too light for white text, bad hex and empty labels', () => {
    expect(brandingProblems({ colors: { primary: '#1F4E79' } })).toEqual([]);
    expect(brandingProblems({ colors: { primary: '#FFD700' } })[0]).toContain('too light');
    expect(brandingProblems({ colors: { accent: 'blue' } })[0]).toContain('#1F6FEB');
    expect(brandingProblems({ roleLabels: { worker: ' ' } })[0]).toContain('job title');
  });
  it('reads leniently: bad values dropped, good ones kept', () => {
    expect(parseBranding({ colors: { primary: '#1F4E79', accent: 'nope' }, roleLabels: { worker: 'Operative' } }))
      .toEqual({ colors: { primary: '#1F4E79' }, roleLabels: { worker: 'Operative' } });
    expect(parseBranding(null)).toEqual({});
  });
  it('job titles fall back to defaults', () => {
    const b = parseBranding({ roleLabels: { worker: 'Operative' } });
    expect(roleLabel(b, 'worker')).toBe('Operative');
    expect(roleLabel(b, 'supervisor')).toBe('Supervisor');
    expect(roleLabel(b, undefined)).toBe('');
  });
});
