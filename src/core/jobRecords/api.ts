// Data access for job records. RLS and the database functions decide what each person sees:
// owners and managers every job; everyone else only jobs they are on.
import { getSupabase } from '@/core/supabase';
import type { JobFilter, JobStatus } from './rules';

export const JOB_RECORDS = 'job_records';

export type JobListRow = {
  id: string; summary: string | null; status: JobStatus; site_address: string | null; customer_name: string | null;
  start_on: string | null; completed_at: string | null; people_count: number;
  last_update_at: string | null; last_update_by: string | null; matched: boolean;
};
export type JobPerson = { id: string; name: string | null; role: string };
export type JobRecord = {
  id: string; summary: string | null; status: JobStatus; site_address: string | null; instructions: string | null;
  start_on: string | null; created_at: string; created_by_name: string | null;
  completed_at: string | null; completed_by_name: string | null;
  customer_id: string | null; customer_name: string | null; customer_phone: string | null; customer_address: string | null;
  people: JobPerson[];
};
export type JobUpdate = { id: string; jobId: string; authorId: string; authorName: string | null; body: string | null; createdAt: string; editedAt: string | null };
export type Person = { id: string; fullName: string; role: string };

export const jobKeys = {
  all: ['job-records'] as const,
  list: (filter: JobFilter, query: string) => ['job-records', 'list', filter, query] as const,
  one: (id: string) => ['job-records', 'one', id] as const,
  updates: (id: string) => ['job-records', 'updates', id] as const,
  people: ['job-records', 'people'] as const,
};

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function fetchJobList(filter: JobFilter, query: string): Promise<JobListRow[]> {
  const { data, error } = await getSupabase().rpc('job_list', { p_filter: filter, p_query: query.trim() || null, p_limit: 200 });
  fail(error);
  return (data ?? []) as JobListRow[];
}

export async function fetchJobRecord(id: string): Promise<JobRecord | null> {
  const { data, error } = await getSupabase().rpc('job_record', { p_job: id });
  fail(error);
  return ((data ?? []) as JobRecord[])[0] ?? null;
}

type UpdateRow = { id: string; job_id: string; author_id: string; body: string | null; created_at: string; edited_at: string | null; profiles: { full_name: string | null } | null };

export async function fetchUpdates(jobId: string): Promise<JobUpdate[]> {
  const { data, error } = await getSupabase()
    .from('job_updates')
    .select('id, job_id, author_id, body, created_at, edited_at, profiles!job_updates_author_fk(full_name)')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });
  fail(error);
  return ((data ?? []) as unknown as UpdateRow[]).map((r) => ({
    id: r.id, jobId: r.job_id, authorId: r.author_id, authorName: r.profiles?.full_name ?? null,
    body: r.body, createdAt: r.created_at, editedAt: r.edited_at,
  }));
}

export async function fetchPeople(): Promise<Person[]> {
  const { data, error } = await getSupabase().from('profiles').select('id, full_name, role').eq('active', true).order('full_name');
  fail(error);
  return (data ?? []).map((p: { id: string; full_name: string | null; role: string }) => ({ id: p.id, fullName: p.full_name ?? 'Unnamed', role: p.role }));
}

export type SaveJobInput = {
  id: string | null; summary: string; siteAddress: string; instructions: string; startOn: string | null;
  customerId: string | null; newCustomer: { name: string; phone: string | null; email: string | null; address: string | null } | null;
  peopleIds: string[];
};

/** Creates or edits a job with its customer and who's on it, in one step. Returns the job id. */
export async function saveJob(v: SaveJobInput): Promise<string> {
  const { data, error } = await getSupabase().rpc('save_job', {
    p_job: v.id, p_summary: v.summary, p_site_address: v.siteAddress || null, p_instructions: v.instructions || null,
    p_start_on: v.startOn || null, p_customer_id: v.customerId, p_customer: v.newCustomer, p_people: v.peopleIds,
  });
  fail(error);
  return data as string;
}

export async function setJobStatus(id: string, status: JobStatus): Promise<void> {
  const { error } = await getSupabase().from('jobs').update({ status }).eq('id', id);
  fail(error);
}

/** Posts an update. The id is made on the phone so photos can be queued against it straight away. */
export async function postUpdate(v: { id: string; tenantId: string; jobId: string; body: string }): Promise<void> {
  const { error } = await getSupabase().from('job_updates').insert({ id: v.id, tenant_id: v.tenantId, job_id: v.jobId, body: v.body.trim() || null });
  fail(error);
}

export async function editUpdate(id: string, body: string): Promise<void> {
  const { error } = await getSupabase().from('job_updates').update({ body: body.trim() || null }).eq('id', id);
  fail(error);
}

export async function deleteUpdate(id: string): Promise<void> {
  const { error } = await getSupabase().from('job_updates').delete().eq('id', id);
  fail(error);
}
