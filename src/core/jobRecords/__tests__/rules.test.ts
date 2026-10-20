import { describe, expect, it } from 'vitest';
import { emptyJobForm, firstName, jobFormProblems, jobRowLine, nextStatuses, updateProblems, whenLabel } from '../rules';

const TZ = 'Europe/Dublin';

describe('jobFormProblems', () => {
  it('needs a summary and a customer', () => {
    expect(jobFormProblems(emptyJobForm(), false)).toEqual(['Say what the job is', 'Pick a customer, or add a new one']);
  });
  it('accepts a minimal job', () => {
    expect(jobFormProblems({ ...emptyJobForm(), summary: 'Bathroom refit' }, true)).toEqual([]);
  });
  it('checks the start date shape', () => {
    expect(jobFormProblems({ ...emptyJobForm(), summary: 'x', startOn: '22/10' }, true)).toHaveLength(1);
  });
});

describe('updateProblems', () => {
  it('needs words or a photo', () => {
    expect(updateProblems('  ', 0)).toHaveLength(1);
    expect(updateProblems('', 1)).toEqual([]);
    expect(updateProblems('Tiles up', 0)).toEqual([]);
  });
  it('caps the length', () => {
    expect(updateProblems('x'.repeat(4001), 0)).toHaveLength(1);
  });
});

describe('labels', () => {
  it('says Today and Yesterday in the business time zone', () => {
    expect(whenLabel('2026-10-20T09:12:00Z', TZ, '2026-10-20')).toBe('Today, 10:12');
    expect(whenLabel('2026-10-19T16:20:00Z', TZ, '2026-10-20')).toBe('Yesterday, 17:20');
  });
  it('uses first names, with a fallback', () => {
    expect(firstName('Adam Byrne')).toBe('Adam');
    expect(firstName(null)).toBe('Someone');
  });
  it('picks the row line by status', () => {
    const base = { status: 'todo', completed_at: null, start_on: null, last_update_at: null, last_update_by: null };
    expect(jobRowLine(base, TZ, '2026-10-20')).toBe('No start date yet');
    expect(jobRowLine({ ...base, last_update_at: '2026-10-20T09:12:00Z', last_update_by: 'Kasia Nowak' }, TZ, '2026-10-20')).toBe('Last update Today, 10:12 · Kasia');
  });
  it('lets a completed job be reopened', () => {
    expect(nextStatuses('completed')).toEqual(['in_progress']);
    expect(nextStatuses('todo')).toEqual(['in_progress', 'completed']);
  });
});
