import { getSupabase } from '@/core/supabase';
import { searchFilter, type Customer, type customerValues } from './rules';

const COLS = 'id, name, phone, email, address, notes';
type Values = ReturnType<typeof customerValues>;

function fail(error: { message: string } | null) { if (error) throw new Error(error.message); }

export const customerKeys = {
  all: ['customers'] as const,
  search: (term: string) => ['customers', 'search', term] as const,
  one: (id: string) => ['customers', 'one', id] as const,
};

export async function searchCustomers(term: string): Promise<Customer[]> {
  const filter = searchFilter(term);
  let q = getSupabase().from('customers').select(COLS).order('name').limit(20);
  if (filter) q = q.or(filter);
  const { data, error } = await q;
  fail(error);
  return (data ?? []) as Customer[];
}

export async function fetchCustomer(id: string): Promise<Customer | null> {
  const { data, error } = await getSupabase().from('customers').select(COLS).eq('id', id).maybeSingle();
  fail(error);
  return (data as Customer | null) ?? null;
}

export async function createCustomer(tenantId: string, v: Values): Promise<Customer> {
  const { data, error } = await getSupabase().from('customers').insert({ tenant_id: tenantId, ...v }).select(COLS).single();
  fail(error);
  return data as Customer;
}

export async function updateCustomer(id: string, v: Values): Promise<Customer> {
  const { data, error } = await getSupabase().from('customers').update(v).eq('id', id).select(COLS).single();
  fail(error);
  return data as Customer;
}
