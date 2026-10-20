// Pure rules for job records (unit-tested). The database checks the same things.
import { formatDay, localDate, localTime, type IsoDate } from '@/core/dates';
import type { PhotoStage } from '@/core/jobFiles/queueRules';

export type JobStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
export type JobFilter = 'active' | 'completed' | 'all';

export const STATUS_LABEL: Record<JobStatus, string> = {
  todo: 'To do', in_progress: 'In progress', completed: 'Completed', cancelled: 'Cancelled',
};
export const statusLabel = (s: string): string => STATUS_LABEL[s as JobStatus] ?? s;
export const statusTone = (s: string): 'neutral' | 'warning' | 'success' =>
  s === 'in_progress' ? 'warning' : s === 'completed' ? 'success' : 'neutral';

export const STAGE_LABEL: Record<PhotoStage, string> = { before: 'Before', progress: 'Progress', completion: 'Completion' };
export const STAGE_HINT: Record<PhotoStage, string> = {
  before: 'What it looked like before you started.',
  progress: 'How it’s going.',
  completion: 'The finished work. Take a few from different angles.',
};

export type JobForm = {
  summary: string; siteAddress: string; instructions: string; startOn: string; peopleIds: string[];
};
export const emptyJobForm = (): JobForm => ({ summary: '', siteAddress: '', instructions: '', startOn: '', peopleIds: [] });

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Plain-English problems with a job form, shown above Save. */
export function jobFormProblems(f: JobForm, hasCustomer: boolean): string[] {
  const out: string[] = [];
  if (!f.summary.trim()) out.push('Say what the job is');
  else if (f.summary.trim().length > 200) out.push('Keep what the job is to 200 characters');
  if (!hasCustomer) out.push('Pick a customer, or add a new one');
  if (f.startOn.trim() && !ISO_DATE.test(f.startOn.trim())) out.push('Enter the start date like 2026-10-22, or leave it blank');
  if (f.instructions.length > 5000) out.push('The instructions are too long (5,000 characters at most)');
  return out;
}

/** An update needs a few words or at least one photo. */
export function updateProblems(body: string, photoCount: number): string[] {
  if (body.trim().length > 4000) return ['Keep the update to 4,000 characters'];
  return body.trim() || photoCount > 0 ? [] : ['Add a few words or a photo'];
}

/** "Today, 10:12", "Yesterday, 17:20" or "Tue 13 Oct, 16:40" in the business's time zone. */
export function whenLabel(iso: string, tz: string, todayIso: IsoDate): string {
  const at = new Date(iso);
  const day = localDate(at, tz);
  const time = localTime(at, tz);
  const yesterday = new Date(`${todayIso}T12:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const label = day === todayIso ? 'Today' : day === yesterday.toISOString().slice(0, 10) ? 'Yesterday' : formatDay(day);
  return `${label}, ${time}`;
}

/** The second line on a jobs list row. */
export function jobRowLine(
  j: { status: string; completed_at: string | null; start_on: string | null; last_update_at: string | null; last_update_by: string | null },
  tz: string, todayIso: IsoDate,
): string {
  if (j.status === 'completed' && j.completed_at) return `Completed ${formatDay(localDate(new Date(j.completed_at), tz))}`;
  if (j.last_update_at) return `Last update ${whenLabel(j.last_update_at, tz, todayIso)}${j.last_update_by ? ` · ${firstName(j.last_update_by)}` : ''}`;
  if (j.start_on) return `Starts ${formatDay(j.start_on)}`;
  return 'No start date yet';
}

export const firstName = (full: string | null | undefined): string => (full ?? '').trim().split(/\s+/)[0] || 'Someone';

/** Statuses a manager can move a job to from where it is now. */
export function nextStatuses(s: string): JobStatus[] {
  if (s === 'todo') return ['in_progress', 'completed'];
  if (s === 'in_progress') return ['completed'];
  if (s === 'completed' || s === 'cancelled') return ['in_progress'];
  return [];
}

/** Status pill: words plus an icon (flows board design guide). */
export function statusPill(s: string): { label: string; tone: 'grey' | 'amber' | 'green'; icon?: string } {
  if (s === 'in_progress') return { label: 'In progress', tone: 'amber', icon: 'time-outline' };
  if (s === 'completed') return { label: 'Completed', tone: 'green', icon: 'checkmark' };
  return { label: statusLabel(s), tone: 'grey' };
}

/** Viewer label: "Old bath · Before · Adam". */
export function photoLabel(caption: string | null | undefined, stage: PhotoStage | null | undefined, who: string | null | undefined): string {
  return [caption, stage ? STAGE_LABEL[stage] : null, who ? firstName(who) : null].filter(Boolean).join(' · ') || 'Photo';
}
