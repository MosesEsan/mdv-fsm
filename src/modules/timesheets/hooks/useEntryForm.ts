import { useMemo, useState } from 'react';
import type { TimesheetsSettings } from '../schemas/settings';
import type { TsEntry } from '../schemas/types';
import { buildEntryPayload, breakIsEditable, formModeFor, type EntryFormValues } from '../services/entryPayload';
import { localTime, type IsoDate } from '@/core/dates';

type Args = {
  settings: TimesheetsSettings;
  timezone: string;
  tenantId: string;
  workerId: string;
  workDate: IsoDate;
  existing?: TsEntry | null;
};

function initialValues(existing: TsEntry | null | undefined, timezone: string): EntryFormValues {
  if (!existing) return { start: '', end: '', breakMinutes: '', hours: '', minutes: '', jobId: null, costCodeId: null, notes: '' };
  return {
    start: existing.started_at ? localTime(new Date(existing.started_at), timezone) : '',
    end: existing.ended_at ? localTime(new Date(existing.ended_at), timezone) : '',
    breakMinutes: existing.break_minutes ? String(existing.break_minutes) : '',
    hours: existing.started_at ? '' : String(Math.floor(existing.duration_minutes / 60)),
    minutes: existing.started_at ? '' : String(existing.duration_minutes % 60),
    jobId: existing.job_id,
    costCodeId: existing.cost_code_id,
    notes: existing.notes ?? '',
  };
}

/** Form state + live preview of what will be saved. The screen just renders it. */
export function useEntryForm(args: Args) {
  const mode = formModeFor(args.settings, args.existing);
  const [values, setValues] = useState<EntryFormValues>(() => initialValues(args.existing, args.timezone));

  const setField = <K extends keyof EntryFormValues>(key: K, value: EntryFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const result = useMemo(() => {
    const incomplete = mode === 'start_end' ? !values.start || !values.end : !values.hours && !values.minutes;
    if (incomplete) return { ok: false as const, error: null };
    try {
      return { ok: true as const, ...buildEntryPayload({ ...args, mode, values }) };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
    }
  }, [args, mode, values]);

  return {
    mode,
    values,
    setField,
    breakEditable: breakIsEditable(args.settings, mode) && (!args.existing || args.settings.breaks === 'manual'),
    fixedBreakNote:
      mode === 'start_end' && args.settings.breaks === 'fixed' && !args.existing
        ? `A ${args.settings.fixedBreakMinutes}-minute break is taken off automatically.`
        : null,
    showJob: args.settings.logAgainst === 'job',
    jobRequired: args.settings.logAgainst === 'job' && args.settings.requireJob,
    showCostCode: args.settings.costCodes,
    result,
  };
}
