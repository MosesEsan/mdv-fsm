import { describe, expect, it } from 'vitest';
import { minutesBetween, shiftInstants } from '@/core/dates';
import { durationForMode, enteredDurationMinutes, resolveBreakMinutes, timedDurationMinutes } from '../services/duration';
import { roundMinutes } from '../services/rounding';
import { buildEntryPayload, formModeFor, type EntryFormValues } from '../services/entryPayload';
import { timesheetsSettingsSchema } from '../schemas/settings';

const at = (iso: string) => new Date(iso);
const off = { breaks: 'off' as const, fixedBreakMinutes: 30 };
const fixed = { breaks: 'fixed' as const, fixedBreakMinutes: 30 };
const manual = { breaks: 'manual' as const, fixedBreakMinutes: 30 };

describe('duration per mode', () => {
  describe('start_end', () => {
    const req = { mode: 'start_end' as const, startedAt: at('2026-10-12T07:00:00Z'), endedAt: at('2026-10-12T15:30:00Z'), enteredBreakMinutes: 20 };
    it('breaks off: finish − start, typed break ignored', () => {
      expect(durationForMode(off, req)).toEqual({ durationMinutes: 510, breakMinutes: 0 });
    });
    it('breaks fixed: fixed break taken off', () => {
      expect(durationForMode(fixed, req)).toEqual({ durationMinutes: 480, breakMinutes: 30 });
    });
    it('breaks manual: typed break taken off', () => {
      expect(durationForMode(manual, req)).toEqual({ durationMinutes: 490, breakMinutes: 20 });
    });
    it('rejects finish before start and break ≥ time worked', () => {
      expect(() => timedDurationMinutes({ startedAt: at('2026-10-12T09:00:00Z'), endedAt: at('2026-10-12T08:00:00Z'), breakMinutes: 0 })).toThrow('after start');
      expect(() => timedDurationMinutes({ startedAt: at('2026-10-12T09:00:00Z'), endedAt: at('2026-10-12T09:30:00Z'), breakMinutes: 30 })).toThrow('break');
    });
    it('rejects more than 24 hours', () => {
      expect(() => timedDurationMinutes({ startedAt: at('2026-10-12T00:00:00Z'), endedAt: at('2026-10-13T00:01:00Z'), breakMinutes: 0 })).toThrow('24 hours');
    });
  });

  describe('duration', () => {
    it('typed total, break always 0', () => {
      expect(durationForMode(manual, { mode: 'duration', hours: 7, minutes: 30 })).toEqual({ durationMinutes: 450, breakMinutes: 0 });
    });
    it('rejects zero, bad minutes and > 24h', () => {
      expect(() => enteredDurationMinutes(0, 0)).toThrow();
      expect(() => enteredDurationMinutes(1, 75)).toThrow();
      expect(() => enteredDurationMinutes(25, 0)).toThrow();
    });
  });

  describe('clock', () => {
    it('same rule as start_end, floored to whole minutes like SQL', () => {
      const req = { mode: 'clock' as const, startedAt: at('2026-10-12T07:00:20Z'), endedAt: at('2026-10-12T16:00:10Z'), enteredBreakMinutes: 0 };
      expect(minutesBetween(req.startedAt, req.endedAt)).toBe(539); // 8h59m50s
      expect(durationForMode(fixed, req)).toEqual({ durationMinutes: 509, breakMinutes: 30 });
    });
  });

  it('resolveBreakMinutes: no times → 0', () => {
    expect(resolveBreakMinutes(fixed, false, 30)).toBe(0);
  });
});

describe('rounding', () => {
  it('rounding to nearest step, exact when 0', () => {
    expect(roundMinutes(487, 15)).toBe(480);
    expect(roundMinutes(488, 15)).toBe(495);
    expect(roundMinutes(487, 0)).toBe(487);
  });
});

describe('entry payload', () => {
  const values: EntryFormValues = { start: '08:00', end: '16:30', breakMinutes: '20', hours: '', minutes: '', jobId: 'job-1', costCodeId: 'cc-1', notes: '  ' };
  const base = { timezone: 'Europe/Dublin', tenantId: 't', workerId: 'w', workDate: '2026-10-12' };

  it('start_end with defaults: times in tenant zone, no cost code, empty notes → null', () => {
    const settings = timesheetsSettingsSchema.parse({});
    const { payload } = buildEntryPayload({ ...base, settings, mode: 'start_end', values });
    expect(payload).toMatchObject({ started_at: '2026-10-12T07:00:00.000Z', ended_at: '2026-10-12T15:30:00.000Z', break_minutes: 0, duration_minutes: 510, job_id: 'job-1', cost_code_id: null, notes: null });
  });

  it('duration mode: no times', () => {
    const settings = timesheetsSettingsSchema.parse({ entryMode: 'duration', logAgainst: 'none' });
    const { payload } = buildEntryPayload({ ...base, settings, mode: formModeFor(settings), values: { ...values, hours: '7', minutes: '15' } });
    expect(payload).toMatchObject({ started_at: null, ended_at: null, duration_minutes: 435, job_id: null });
  });

  it('requireJob blocks a missing job', () => {
    const settings = timesheetsSettingsSchema.parse({ requireJob: true });
    expect(() => buildEntryPayload({ ...base, settings, mode: 'start_end', values: { ...values, jobId: null } })).toThrow('job');
  });

  it('clock mode adds a manual correction with times', () => {
    expect(formModeFor(timesheetsSettingsSchema.parse({ entryMode: 'clock' }))).toBe('start_end');
  });
});
