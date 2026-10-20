// Data access for the module. RLS decides what each person can see; these functions
// never filter by role themselves.
import { getSupabase, unwrap } from '@/core/supabase';
import type { IsoDate } from '@/core/dates';
import type {
  Option, TsClockSession, TsEntry, TsEntryPayload, TsEvent, TsWeek, TsWeekSummary,
} from '../schemas/types';

const db = () => getSupabase();

export async function fetchEntries(workerId: string, from: IsoDate, to: IsoDate): Promise<TsEntry[]> {
  return unwrap(
    await db().from('ts_entries').select('*')
      .eq('worker_id', workerId).gte('work_date', from).lte('work_date', to)
      .order('work_date').order('started_at', { nullsFirst: false }),
  ) as TsEntry[];
}

export async function fetchEntry(id: string): Promise<TsEntry> {
  return unwrap(await db().from('ts_entries').select('*').eq('id', id).single()) as TsEntry;
}

export async function fetchWeekFor(workerId: string, weekStart: IsoDate): Promise<TsWeek | null> {
  return unwrap(
    await db().from('ts_weeks').select('*').eq('worker_id', workerId).eq('week_start', weekStart).maybeSingle(),
  ) as TsWeek | null;
}

export async function fetchWeekById(weekId: string): Promise<TsWeek> {
  return unwrap(await db().from('ts_weeks').select('*').eq('id', weekId).single()) as TsWeek;
}

export async function fetchWeekSummaries(weekStart: IsoDate): Promise<TsWeekSummary[]> {
  return unwrap(await db().from('v_ts_weekly').select('*').eq('week_start', weekStart)) as TsWeekSummary[];
}

export async function fetchWeekEvents(weekId: string): Promise<TsEvent[]> {
  return unwrap(await db().from('ts_events').select('*').eq('week_id', weekId).order('created_at')) as TsEvent[];
}

export async function fetchClockSession(workerId: string): Promise<TsClockSession | null> {
  return unwrap(await db().from('ts_clock_sessions').select('*').eq('worker_id', workerId).maybeSingle()) as TsClockSession | null;
}

/** Jobs the person can see (core RLS: a fitter only sees jobs they're booked on). */
export async function fetchJobOptions(): Promise<Option[]> {
  const rows = unwrap(await db().from('jobs').select('id, summary').order('created_at', { ascending: false }).limit(200)) as { id: string; summary: string | null }[];
  return rows.map((r) => ({ id: r.id, label: r.summary || 'Untitled job' }));
}

export async function fetchCostCodes(): Promise<Option[]> {
  const rows = unwrap(await db().from('ts_cost_codes').select('id, code, label').eq('active', true).order('code')) as { id: string; code: string; label: string }[];
  return rows.map((r) => ({ id: r.id, label: `${r.code} · ${r.label}` }));
}

export async function fetchPeople(): Promise<Option[]> {
  const rows = unwrap(await db().from('profiles').select('id, full_name').order('full_name')) as { id: string; full_name: string | null }[];
  return rows.map((r) => ({ id: r.id, label: r.full_name || 'Unnamed' }));
}

export async function fetchMyAssignedWorkerIds(supervisorId: string): Promise<string[]> {
  const rows = unwrap(await db().from('ts_assignments').select('worker_id').eq('supervisor_id', supervisorId)) as { worker_id: string }[];
  return rows.map((r) => r.worker_id);
}

// ---- writes ----------------------------------------------------------------

export async function insertEntry(payload: TsEntryPayload): Promise<TsEntry> {
  return unwrap(await db().from('ts_entries').insert(payload).select().single()) as TsEntry;
}

export async function updateEntry(id: string, patch: Partial<TsEntryPayload>): Promise<TsEntry> {
  return unwrap(await db().from('ts_entries').update(patch).eq('id', id).select().single()) as TsEntry;
}

export async function deleteEntry(id: string): Promise<void> {
  unwrap(await db().from('ts_entries').delete().eq('id', id));
}

export async function submitWeek(weekId: string): Promise<TsWeek> {
  return unwrap(await db().rpc('ts_submit_week', { p_week_id: weekId })) as TsWeek;
}

export async function decideWeek(weekId: string, decision: 'approve' | 'reject', reason?: string): Promise<TsWeek> {
  return unwrap(await db().rpc('ts_decide_week', { p_week_id: weekId, p_decision: decision, p_reason: reason ?? null })) as TsWeek;
}

export async function reopenWeek(weekId: string, reason: string): Promise<TsWeek> {
  return unwrap(await db().rpc('ts_reopen_week', { p_week_id: weekId, p_reason: reason })) as TsWeek;
}

export async function clockIn(args: { jobId?: string | null; costCodeId?: string | null; notes?: string | null }): Promise<TsClockSession> {
  return unwrap(await db().rpc('ts_clock_in', { p_job_id: args.jobId ?? null, p_cost_code_id: args.costCodeId ?? null, p_notes: args.notes ?? null })) as TsClockSession;
}

export async function clockOut(args: { workerId?: string; endAt?: string; breakMinutes?: number } = {}): Promise<TsEntry> {
  return unwrap(await db().rpc('ts_clock_out', { p_worker_id: args.workerId ?? null, p_end_at: args.endAt ?? null, p_break_minutes: args.breakMinutes ?? null })) as TsEntry;
}

export async function clockCancel(workerId?: string): Promise<void> {
  unwrap(await db().rpc('ts_clock_cancel', { p_worker_id: workerId ?? null }));
}
