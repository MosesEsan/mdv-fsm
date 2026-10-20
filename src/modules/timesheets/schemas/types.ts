// Row types for the module's tables and views.
// Swap for `supabase gen types` output once the generated types include these tables.
import type { IsoDate } from '@/core/dates';

export type WeekStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'exported';
export type EntrySource = 'manual' | 'clock' | 'booking';

export type TsEntry = {
  id: string;
  tenant_id: string;
  week_id: string;
  worker_id: string;
  work_date: IsoDate;
  job_id: string | null;
  cost_code_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  break_minutes: number;
  duration_minutes: number;
  source: EntrySource;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

/** What the app sends. The trigger recomputes work_date (timed), break, duration and week. */
export type TsEntryPayload = {
  tenant_id: string;
  worker_id: string;
  work_date: IsoDate;
  started_at: string | null;
  ended_at: string | null;
  break_minutes: number;
  duration_minutes: number;
  job_id: string | null;
  cost_code_id: string | null;
  notes: string | null;
};

export type TsWeek = {
  id: string;
  tenant_id: string;
  worker_id: string;
  week_start: IsoDate;
  status: WeekStatus;
  submitted_at: string | null;
  decided_by: string | null;
  decided_at: string | null;
  reject_reason: string | null;
  exported_at: string | null;
};

export type TsWeekSummary = {
  tenant_id: string;
  week_id: string;
  worker_id: string;
  week_start: IsoDate;
  status: WeekStatus;
  submitted_at: string | null;
  decided_at: string | null;
  reject_reason: string | null;
  total_minutes: number;
  rounded_minutes: number;
  normal_minutes: number;
  overtime_minutes: number;
};

export type TsEvent = {
  id: string;
  week_id: string;
  actor_id: string | null;
  action: 'submitted' | 'approved' | 'rejected' | 'reopened' | 'entry_added' | 'entry_changed' | 'entry_deleted' | 'exported';
  detail: Record<string, unknown>;
  created_at: string;
};

export type TsClockSession = {
  id: string;
  worker_id: string;
  started_at: string;
  job_id: string | null;
  cost_code_id: string | null;
  notes: string | null;
};

export type Option = { id: string; label: string };
