// Pure duration rules. Mirror of private.ts_entries_before_write() so the form preview
// shows exactly what the database will store. The database is still the authority.
import { minutesBetween } from '@/core/dates';
import type { TimesheetsSettings } from '../schemas/settings';

export const MAX_ENTRY_MINUTES = 24 * 60;

export class DurationError extends Error {}

export type TimedInput = { startedAt: Date; endedAt: Date; breakMinutes: number };


/** Break the database will apply when a new entry is created. */
export function resolveBreakMinutes(
  settings: Pick<TimesheetsSettings, 'breaks' | 'fixedBreakMinutes'>,
  hasTimes: boolean,
  entered: number,
): number {
  if (!hasTimes || settings.breaks === 'off') return 0;
  if (settings.breaks === 'fixed') return settings.fixedBreakMinutes;
  return entered;
}

/** Net minutes for a timed entry ('start_end' or 'clock'). */
export function timedDurationMinutes({ startedAt, endedAt, breakMinutes }: TimedInput): number {
  if (endedAt.getTime() <= startedAt.getTime()) throw new DurationError('Finish time must be after start time');
  const span = minutesBetween(startedAt, endedAt);
  if (span > MAX_ENTRY_MINUTES) throw new DurationError('An entry can’t be longer than 24 hours');
  if (breakMinutes < 0) throw new DurationError('Break can’t be negative');
  const net = span - breakMinutes;
  if (net < 1) throw new DurationError('The break is as long as the time worked');
  return net;
}

/** Net minutes for a total-hours entry ('duration'): what was typed, no break. */
export function enteredDurationMinutes(hours: number, minutes: number): number {
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || minutes < 0 || minutes > 59) {
    throw new DurationError('Enter whole hours and 0–59 minutes');
  }
  const total = hours * 60 + minutes;
  if (total < 1) throw new DurationError('Enter the time worked');
  if (total > MAX_ENTRY_MINUTES) throw new DurationError('An entry can’t be longer than 24 hours');
  return total;
}

export type DurationRequest =
  | { mode: 'start_end' | 'clock'; startedAt: Date; endedAt: Date; enteredBreakMinutes: number }
  | { mode: 'duration'; hours: number; minutes: number };

/** Duration per entry mode, applying the tenant's break rule. */
export function durationForMode(
  settings: Pick<TimesheetsSettings, 'breaks' | 'fixedBreakMinutes'>,
  req: DurationRequest,
): { durationMinutes: number; breakMinutes: number } {
  if (req.mode === 'duration') {
    return { durationMinutes: enteredDurationMinutes(req.hours, req.minutes), breakMinutes: 0 };
  }
  const breakMinutes = resolveBreakMinutes(settings, true, req.enteredBreakMinutes);
  return {
    durationMinutes: timedDurationMinutes({ startedAt: req.startedAt, endedAt: req.endedAt, breakMinutes }),
    breakMinutes,
  };
}

