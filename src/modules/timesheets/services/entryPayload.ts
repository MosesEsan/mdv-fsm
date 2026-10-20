// Turns what someone typed into the row the database expects, applying the tenant's settings.
import type { TimesheetsSettings } from '../schemas/settings';
import type { TsEntry, TsEntryPayload } from '../schemas/types';
import { durationForMode, DurationError } from './duration';
import { shiftInstants, type IsoDate } from '@/core/dates';

export type FormMode = 'start_end' | 'duration';

export type EntryFormValues = {
  start: string;  // 'HH:MM'
  end: string;    // 'HH:MM'
  breakMinutes: string;
  hours: string;
  minutes: string;
  jobId: string | null;
  costCodeId: string | null;
  notes: string;
};

/** Which form to show. Clock mode has no manual form for workers; managers correct with times. */
export function formModeFor(settings: Pick<TimesheetsSettings, 'entryMode'>, existing?: Pick<TsEntry, 'started_at'> | null): FormMode {
  if (existing) return existing.started_at ? 'start_end' : 'duration';
  return settings.entryMode === 'duration' ? 'duration' : 'start_end';
}

/** Whether the person can type a break (mirrors the trigger: manual mode, timed entries). */
export function breakIsEditable(settings: Pick<TimesheetsSettings, 'breaks'>, mode: FormMode): boolean {
  return mode === 'start_end' && settings.breaks === 'manual';
}

type BuildArgs = {
  settings: TimesheetsSettings;
  timezone: string;
  tenantId: string;
  workerId: string;
  workDate: IsoDate;
  mode: FormMode;
  values: EntryFormValues;
  existing?: TsEntry | null;
};

function toInt(text: string): number {
  const t = text.trim();
  if (t === '') return 0;
  const n = Number(t);
  if (!Number.isInteger(n)) throw new DurationError('Use whole numbers');
  return n;
}

export function buildEntryPayload(a: BuildArgs): { payload: TsEntryPayload; durationMinutes: number; breakMinutes: number } {
  const { settings, values } = a;

  const jobId = settings.logAgainst === 'job' ? values.jobId : null;
  if (settings.logAgainst === 'job' && settings.requireJob && !jobId) throw new DurationError('Please pick a job');
  const costCodeId = settings.costCodes ? values.costCodeId : null;
  const notes = values.notes.trim() || null;

  if (a.mode === 'duration') {
    const { durationMinutes } = durationForMode(settings, { mode: 'duration', hours: toInt(values.hours), minutes: toInt(values.minutes) });
    return {
      durationMinutes,
      breakMinutes: 0,
      payload: {
        tenant_id: a.tenantId, worker_id: a.workerId, work_date: a.workDate,
        started_at: null, ended_at: null, break_minutes: 0, duration_minutes: durationMinutes,
        job_id: jobId, cost_code_id: costCodeId, notes,
      },
    };
  }

  const { startedAt, endedAt } = shiftInstants(a.workDate, values.start.trim(), values.end.trim(), a.timezone);
  // On edits, the database keeps the original break unless breaks are entered manually.
  const effectiveSettings = a.existing && settings.breaks !== 'manual'
    ? { breaks: 'manual' as const, fixedBreakMinutes: 0 }
    : settings;
  const enteredBreak = a.existing && settings.breaks !== 'manual' ? a.existing.break_minutes : toInt(values.breakMinutes);
  const { durationMinutes, breakMinutes } = durationForMode(effectiveSettings, {
    mode: 'start_end', startedAt, endedAt, enteredBreakMinutes: enteredBreak,
  });

  return {
    durationMinutes,
    breakMinutes,
    payload: {
      tenant_id: a.tenantId, worker_id: a.workerId, work_date: a.workDate,
      started_at: startedAt.toISOString(), ended_at: endedAt.toISOString(),
      break_minutes: breakMinutes, duration_minutes: durationMinutes,
      job_id: jobId, cost_code_id: costCodeId, notes,
    },
  };
}
