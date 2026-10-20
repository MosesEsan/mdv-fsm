// Quotes and prices. Every table here is owner-only in the database.
import { getSupabase } from '@/core/supabase';
import type { PriceItem, Unit } from './quoteRules';

export type QuoteSummary = {
  id: string; job_id: string; number: number; status: 'draft' | 'sent' | 'accepted' | 'declined';
  vat_rate: number | null; valid_until: string | null; notes: string | null; pdf_file_id: string | null;
  sent_at: string | null; created_at: string; subtotal: number; vat_amount: number; total: number; line_count: number;
};
export type QuoteLine = { id: string; description: string; quantity: number; unit: Unit; unit_price: number; line_total: number; sort_order: number };
export type QuoteProfile = {
  phone: string | null; email: string | null; address: string | null; vat_number: string | null; terms: string | null;
  default_valid_days: number; default_vat_rate: number | null;
};

export const quoteKeys = {
  all: ['flooring', 'quotes'] as const,
  forJob: (jobId: string) => ['flooring', 'quotes', 'job', jobId] as const,
  one: (id: string) => ['flooring', 'quotes', 'one', id] as const,
  prices: ['flooring', 'quotes', 'prices'] as const,
  profile: ['flooring', 'quotes', 'profile'] as const,
};

function fail(error: { message: string } | null) { if (error) throw new Error(error.message); }
const num = (x: unknown) => (x === null || x === undefined ? null : Number(x));
const toSummary = (r: Record<string, unknown>): QuoteSummary => ({
  ...(r as unknown as QuoteSummary), vat_rate: num(r.vat_rate), subtotal: Number(r.subtotal), vat_amount: Number(r.vat_amount), total: Number(r.total),
});

export async function fetchJobQuotes(jobId: string): Promise<QuoteSummary[]> {
  const { data, error } = await getSupabase().from('fl_v_quotes').select('*').eq('job_id', jobId).order('number', { ascending: false });
  fail(error);
  return (data ?? []).map(toSummary);
}

export async function fetchQuote(id: string): Promise<{ quote: QuoteSummary; lines: QuoteLine[] } | null> {
  const [q, l] = await Promise.all([
    getSupabase().from('fl_v_quotes').select('*').eq('id', id).maybeSingle(),
    getSupabase().from('fl_quote_lines').select('id, description, quantity, unit, unit_price, line_total, sort_order').eq('quote_id', id).order('sort_order'),
  ]);
  fail(q.error); fail(l.error);
  if (!q.data) return null;
  return {
    quote: toSummary(q.data as Record<string, unknown>),
    lines: (l.data ?? []).map((x: Record<string, unknown>) => ({ ...(x as unknown as QuoteLine), quantity: Number(x.quantity), unit_price: Number(x.unit_price), line_total: Number(x.line_total) })),
  };
}

export async function saveQuote(v: { id?: string; jobId: string; vatRate: number | null; validUntil: string | null; notes: string; lines: unknown[] }): Promise<string> {
  const { data, error } = await getSupabase().rpc('fl_save_quote', {
    p_id: v.id ?? null, p_job_id: v.jobId, p_vat_rate: v.vatRate, p_valid_until: v.validUntil, p_notes: v.notes, p_lines: v.lines,
  });
  fail(error);
  return data as string;
}

export async function copyQuote(id: string): Promise<string> {
  const { data, error } = await getSupabase().rpc('fl_copy_quote', { p_id: id });
  fail(error);
  return data as string;
}

export async function setQuoteStatus(id: string, status: QuoteSummary['status'], pdfFileId?: string): Promise<void> {
  const { error } = await getSupabase().from('fl_quotes').update({ status, ...(pdfFileId ? { pdf_file_id: pdfFileId } : {}) }).eq('id', id);
  fail(error);
}

export async function deleteDraft(id: string): Promise<void> {
  const { error } = await getSupabase().from('fl_quotes').delete().eq('id', id).eq('status', 'draft');
  fail(error);
}

export async function fetchPrices(): Promise<PriceItem[]> {
  const { data, error } = await getSupabase().from('fl_price_items').select('id, kind, name, unit, unit_price, active, sort_order').order('kind').order('sort_order').order('name');
  fail(error);
  return (data ?? []).map((p: Record<string, unknown>) => ({ ...(p as unknown as PriceItem), unit_price: Number(p.unit_price) }));
}

export async function savePrice(tenantId: string, p: Omit<PriceItem, 'id' | 'sort_order'> & { id?: string }): Promise<void> {
  const row = { tenant_id: tenantId, kind: p.kind, name: p.name, unit: p.unit, unit_price: p.unit_price, active: p.active };
  const { error } = p.id
    ? await getSupabase().from('fl_price_items').update(row).eq('id', p.id)
    : await getSupabase().from('fl_price_items').insert(row);
  fail(error);
}

export async function fetchProfile(): Promise<QuoteProfile | null> {
  const { data, error } = await getSupabase().from('fl_quote_profile')
    .select('phone, email, address, vat_number, terms, default_valid_days, default_vat_rate').maybeSingle();
  fail(error);
  return data ? { ...(data as QuoteProfile), default_vat_rate: num((data as QuoteProfile).default_vat_rate) } : null;
}

export async function saveProfile(tenantId: string, p: QuoteProfile): Promise<void> {
  const { error } = await getSupabase().from('fl_quote_profile').upsert({ tenant_id: tenantId, ...p, updated_at: new Date().toISOString() });
  fail(error);
}
