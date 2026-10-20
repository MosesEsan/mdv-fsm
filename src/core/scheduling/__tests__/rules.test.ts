import { describe, expect, it } from 'vitest';
import { bookingToForm, byDay, clashesFor, formProblems, formToRange, rangeForDays, type BookingLite } from '../rules';

const tz = 'Europe/Dublin';
const b = (id: string, s: string, e: string, users: string[], status: BookingLite['status'] = 'scheduled'): BookingLite =>
  ({ id, startsAt: s, endsAt: e, userIds: users, status });

describe('scheduling rules', () => {
  it('checks the form in plain English', () => {
    expect(formProblems({ date: '2026-11-02', start: '09:00', end: '13:00', userIds: ['u1'], jobId: 'j' })).toEqual([]);
    expect(formProblems({ date: '2026-11-02', start: '13:00', end: '09:00', userIds: [], jobId: null }))
      .toEqual(['Pick a job', 'The finish time must be after the start time', 'Pick at least one person']);
    expect(formProblems({ date: '2026-11-02', start: '9', end: '13:00', userIds: ['u1'], jobId: 'j' })[0]).toContain('start time');
  });
  it('turns local times into instants (winter and summer time)', () => {
    expect(formToRange({ date: '2026-11-02', start: '09:00', end: '13:00', userIds: [], jobId: 'j' }, tz).startsAt.toISOString()).toBe('2026-11-02T09:00:00.000Z');
    expect(formToRange({ date: '2026-07-01', start: '09:00', end: '13:00', userIds: [], jobId: 'j' }, tz).startsAt.toISOString()).toBe('2026-07-01T08:00:00.000Z');
    expect(bookingToForm({ startsAt: '2026-07-01T08:00:00Z', endsAt: '2026-07-01T12:30:00Z', userIds: ['u'], jobId: 'j' }, tz))
      .toEqual({ date: '2026-07-01', start: '09:00', end: '13:30', userIds: ['u'], jobId: 'j' });
  });
  it('finds clashes like the database does (back-to-back and cancelled are fine)', () => {
    const list = [b('1', '2026-11-02T09:00:00Z', '2026-11-02T13:00:00Z', ['u1']), b('2', '2026-11-02T13:00:00Z', '2026-11-02T15:00:00Z', ['u2']),
      b('3', '2026-11-02T10:00:00Z', '2026-11-02T11:00:00Z', ['u1'], 'cancelled')];
    const at = (s: string, e: string) => [new Date(s), new Date(e)] as const;
    expect(clashesFor(list, ['u1'], ...at('2026-11-02T12:00:00Z', '2026-11-02T14:00:00Z')).map((x) => x.id)).toEqual(['1']);
    expect(clashesFor(list, ['u1'], ...at('2026-11-02T13:00:00Z', '2026-11-02T14:00:00Z'))).toEqual([]);
    expect(clashesFor(list, ['u1'], ...at('2026-11-02T12:00:00Z', '2026-11-02T14:00:00Z'), '1')).toEqual([]);
  });
  it('groups by local day and loads the right range', () => {
    const days = ['2026-11-02', '2026-11-03'];
    const g = byDay([{ startsAt: '2026-11-03T08:00:00Z' }, { startsAt: '2026-11-02T15:00:00Z' }, { startsAt: '2026-11-02T09:00:00Z' }, { startsAt: '2026-11-09T09:00:00Z' }], days, tz);
    expect(g['2026-11-02'].map((x) => x.startsAt)).toEqual(['2026-11-02T09:00:00Z', '2026-11-02T15:00:00Z']);
    expect(g['2026-11-03'].length).toBe(1);
    expect(rangeForDays(days, tz)).toEqual({ from: '2026-11-02T00:00:00.000Z', to: '2026-11-04T00:00:00.000Z' });
  });
});
