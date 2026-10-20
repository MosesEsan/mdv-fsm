// Data access for scheduling. RLS decides what each person sees (managers: all; staff: their own).
import { getSupabase } from '@/core/supabase';
import type { BookingLite } from './rules';

export type Booking = BookingLite & {
  jobId: string; notes: string | null; jobSummary: string | null; siteAddress: string | null;
};
export type Person = { id: string; fullName: string; role: string };
export type JobOption = { id: string; summary: string | null; siteAddress: string | null; status: string };
export type JobSheet = {
  booking_id: string; starts_at: string; ends_at: string; status: string; notes: string | null;
  job_id: string; job_summary: string | null; job_status: string; site_address: string | null;
  customer_name: string | null; customer_phone: string | null; customer_address: string | null;
  people: { id: string; name: string | null }[];
};

export const scheduleKeys = {
  all: ['schedule'] as const,
  range: (from: string, to: string) => ['schedule', 'range', from, to] as const,
  sheet: (id: string) => ['schedule', 'sheet', id] as const,
  people: ['schedule', 'people'] as const,
  jobs: ['schedule', 'jobs'] as const,
};

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

type Row = {
  id: string; job_id: string; starts_at: string; ends_at: string; status: 'scheduled' | 'cancelled'; notes: string | null;
  jobs: { summary: string | null; site_address: string | null } | null;
  booking_assignees: { user_id: string }[] | null;
};

export async function fetchBookings(from: string, to: string): Promise<Booking[]> {
  const { data, error } = await getSupabase()
    .from('bookings')
    .select('id, job_id, starts_at, ends_at, status, notes, jobs!bookings_job_fk(summary, site_address), booking_assignees!booking_assignees_booking_fk(user_id)')
    .lt('starts_at', to)
    .gt('ends_at', from)
    .order('starts_at');
  fail(error);
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id, jobId: r.job_id, startsAt: r.starts_at, endsAt: r.ends_at, status: r.status, notes: r.notes,
    jobSummary: r.jobs?.summary ?? null, siteAddress: r.jobs?.site_address ?? null,
    userIds: (r.booking_assignees ?? []).map((a) => a.user_id),
  }));
}

export async function fetchPeople(): Promise<Person[]> {
  const { data, error } = await getSupabase().from('profiles').select('id, full_name, role').eq('active', true).order('full_name');
  fail(error);
  return (data ?? []).map((p: { id: string; full_name: string | null; role: string }) => ({ id: p.id, fullName: p.full_name ?? 'Unnamed', role: p.role }));
}

export async function fetchJobs(): Promise<JobOption[]> {
  const { data, error } = await getSupabase().from('jobs').select('id, summary, site_address, status').order('created_at', { ascending: false }).limit(200);
  fail(error);
  return (data ?? []).map((j: { id: string; summary: string | null; site_address: string | null; status: string }) =>
    ({ id: j.id, summary: j.summary, siteAddress: j.site_address, status: j.status }));
}

/** Quick job for the diary (no customer yet). The full enquiry flow lives in a module. */
export async function createJob(tenantId: string, summary: string, siteAddress: string): Promise<JobOption> {
  const { data, error } = await getSupabase().from('jobs')
    .insert({ tenant_id: tenantId, summary, site_address: siteAddress || null })
    .select('id, summary, site_address, status').single();
  fail(error);
  const j = data as { id: string; summary: string | null; site_address: string | null; status: string };
  return { id: j.id, summary: j.summary, siteAddress: j.site_address, status: j.status };
}

export async function saveBooking(v: { id?: string; jobId: string; startsAt: Date; endsAt: Date; userIds: string[]; notes: string }): Promise<string> {
  const { data, error } = await getSupabase().rpc('save_booking', {
    p_id: v.id ?? null, p_job_id: v.jobId, p_starts: v.startsAt.toISOString(), p_ends: v.endsAt.toISOString(),
    p_user_ids: v.userIds, p_notes: v.notes,
  });
  fail(error);
  return (data as { id: string }).id;
}

export async function cancelBooking(id: string): Promise<void> {
  const { error } = await getSupabase().rpc('cancel_booking', { p_id: id });
  fail(error);
}

export async function fetchJobSheet(bookingId: string): Promise<JobSheet | null> {
  const { data, error } = await getSupabase().rpc('booking_job_sheet', { p_booking: bookingId });
  fail(error);
  return ((data ?? []) as JobSheet[])[0] ?? null;
}
