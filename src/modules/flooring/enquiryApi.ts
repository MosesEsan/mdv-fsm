import { getSupabase } from '@/core/supabase';
import type { customerValues } from '@/core/customers/rules';

export type EnquiryRow = {
  enquiry_id: string; job_id: string; source: string; received_at: string; details: string | null;
  status: 'open' | 'lost'; lost_reason: string | null; job_summary: string | null; site_address: string | null;
  customer_id: string | null; customer_name: string | null; customer_phone: string | null; customer_email: string | null;
  viewed_at: string | null; room_count: number; next_booking_at: string | null; stage: string;
};

export const enquiryKeys = {
  all: ['flooring', 'enquiries'] as const,
  list: (scope: 'open' | 'all') => ['flooring', 'enquiries', 'list', scope] as const,
  one: (jobId: string) => ['flooring', 'enquiries', 'one', jobId] as const,
};

function fail(error: { message: string } | null) { if (error) throw new Error(error.message); }

export async function fetchEnquiries(scope: 'open' | 'all'): Promise<EnquiryRow[]> {
  let q = getSupabase().from('fl_v_enquiries').select('*').order('received_at', { ascending: false }).limit(300);
  if (scope === 'open') q = q.eq('status', 'open');
  const { data, error } = await q;
  fail(error);
  return (data ?? []) as EnquiryRow[];
}

export async function fetchEnquiry(jobId: string): Promise<EnquiryRow | null> {
  const { data, error } = await getSupabase().from('fl_v_enquiries').select('*').eq('job_id', jobId).maybeSingle();
  fail(error);
  return (data as EnquiryRow | null) ?? null;
}

export async function createEnquiry(v: {
  customerId: string | null; newCustomer: ReturnType<typeof customerValues> | null;
  summary: string; siteAddress: string; source: string; details: string; viewingAt: Date | null;
}): Promise<string> {
  const { data, error } = await getSupabase().rpc('fl_create_enquiry', {
    p_customer_id: v.customerId, p_customer: v.newCustomer, p_summary: v.summary, p_site_address: v.siteAddress,
    p_source: v.source, p_details: v.details, p_viewing_at: v.viewingAt?.toISOString() ?? null,
  });
  fail(error);
  return (data as { job_id: string }).job_id;
}

export async function setEnquiryOutcome(jobId: string, lost: boolean, reason: string | null): Promise<void> {
  const { error } = await getSupabase().from('fl_enquiries')
    .update({ status: lost ? 'lost' : 'open', lost_reason: lost ? reason : null }).eq('job_id', jobId);
  fail(error);
}

/** Sets or clears the viewing time without touching the rest of the viewing. */
export async function setViewingTime(tenantId: string, jobId: string, at: Date | null): Promise<void> {
  const { error } = await getSupabase().from('fl_viewings')
    .upsert({ tenant_id: tenantId, job_id: jobId, viewed_at: at?.toISOString() ?? null }, { onConflict: 'tenant_id,job_id' });
  fail(error);
}

export async function updateJob(jobId: string, v: { summary: string; site_address: string | null }): Promise<void> {
  const { error } = await getSupabase().from('jobs').update(v).eq('id', jobId);
  fail(error);
}
