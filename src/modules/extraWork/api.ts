// Data access for extra work. RLS decides who sees what: the same people as the job.
import { getSupabase } from '@/core/supabase';

export const EXTRA_WORK = 'extra_work';

export type ExtraEntry = {
  id: string; jobId: string; jobSummary: string | null; customerName: string | null; loggedBy: string; loggedByName: string | null;
  what: string; why: string | null; hours: number | null; materials: string | null;
  createdAt: string; invoicedAt: string | null; fileIds: string[];
};

export const xwKeys = {
  all: ['extra-work'] as const,
  list: (scope: 'open' | 'all') => ['extra-work', 'list', scope] as const,
  job: (jobId: string) => ['extra-work', 'job', jobId] as const,
  one: (id: string) => ['extra-work', 'one', id] as const,
  counts: ['extra-work', 'counts'] as const,
};

const SELECT = 'id, job_id, logged_by, what, why, hours, materials, created_at, invoiced_at, jobs(summary, customers(name)), profiles!xw_entries_logged_by_fk(full_name), xw_entry_files(file_id)';

type Row = {
  id: string; job_id: string; logged_by: string; what: string; why: string | null; hours: number | string | null; materials: string | null;
  created_at: string; invoiced_at: string | null;
  jobs: { summary: string | null; customers: { name: string | null } | null } | null; profiles: { full_name: string | null } | null; xw_entry_files: { file_id: string }[] | null;
};

const toEntry = (r: Row): ExtraEntry => ({
  id: r.id, jobId: r.job_id, jobSummary: r.jobs?.summary ?? null, customerName: r.jobs?.customers?.name ?? null, loggedBy: r.logged_by, loggedByName: r.profiles?.full_name ?? null,
  what: r.what, why: r.why, hours: r.hours == null ? null : Number(r.hours), materials: r.materials,
  createdAt: r.created_at, invoicedAt: r.invoiced_at, fileIds: (r.xw_entry_files ?? []).map((f) => f.file_id),
});

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function fetchEntries(scope: 'open' | 'all'): Promise<ExtraEntry[]> {
  let q = getSupabase().from('xw_entries').select(SELECT).order('created_at', { ascending: false }).limit(200);
  if (scope === 'open') q = q.is('invoiced_at', null);
  const { data, error } = await q;
  fail(error);
  return ((data ?? []) as unknown as Row[]).map(toEntry);
}

export async function fetchJobEntries(jobId: string): Promise<ExtraEntry[]> {
  const { data, error } = await getSupabase().from('xw_entries').select(SELECT).eq('job_id', jobId).order('created_at', { ascending: false });
  fail(error);
  return ((data ?? []) as unknown as Row[]).map(toEntry);
}

export async function fetchEntry(id: string): Promise<ExtraEntry | null> {
  const { data, error } = await getSupabase().from('xw_entries').select(SELECT).eq('id', id).maybeSingle();
  fail(error);
  return data ? toEntry(data as unknown as Row) : null;
}

export async function fetchOpenCounts(): Promise<Record<string, number>> {
  const { data, error } = await getSupabase().rpc('xw_open_counts');
  fail(error);
  return Object.fromEntries(((data ?? []) as { job_id: string; open_count: number }[]).map((r) => [r.job_id, r.open_count]));
}

export async function addEntry(v: {
  id: string; tenantId: string; jobId: string; what: string; why: string | null; hours: number | null; materials: string | null;
}): Promise<void> {
  const { error } = await getSupabase().from('xw_entries').insert({
    id: v.id, tenant_id: v.tenantId, job_id: v.jobId, what: v.what, why: v.why, hours: v.hours, materials: v.materials,
  });
  fail(error);
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await getSupabase().from('xw_entries').delete().eq('id', id);
  fail(error);
}

export async function setInvoiced(id: string, invoiced: boolean): Promise<void> {
  const { error } = await getSupabase().rpc('xw_set_invoiced', { p_entry: id, p_invoiced: invoiced });
  fail(error);
}

/** Links an uploaded photo to its entry. Runs from the upload queue, so it must be safe to run twice. */
export async function linkEntryFile(tenantId: string, entryId: string, fileId: string): Promise<void> {
  const { error } = await getSupabase().from('xw_entry_files').insert({ tenant_id: tenantId, entry_id: entryId, file_id: fileId });
  if (error && !/duplicate key/i.test(error.message)) throw new Error(error.message);
}
