// Customer visits (Timesheets with logAgainst = 'customer'): reads, saves and the monthly report.
// RLS decides what each person gets: workers their own visits, owner/managers/accounts everyone's.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fileExportsKey, type FileExport } from '@/core/files/exports';
import { callFunction } from '@/core/functions';
import { getSupabase, unwrap } from '@/core/supabase';
import type { IsoDate } from '@/core/dates';
import type { MaterialUnit, Visit } from '../schemas/visit';
import { visitPayload } from '../schemas/visit';
import { tsKeys } from '../api/hooks';

export type VisitMaterial = { item: string; quantity: number; unit: MaterialUnit };
export type VisitRow = {
  id: string;
  worker_id: string;
  customer_id: string | null;
  work_date: IsoDate;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number;
  notes: string | null;
  corrected_by: string | null;
  corrected_at: string | null;
  materials: VisitMaterial[];
};
export type NamedOption = { id: string; name: string };

const db = () => getSupabase();
const keys = {
  visits: (from: IsoDate, to: IsoDate) => [...tsKeys.all, 'visits', from, to] as const,
  visit: (id: string) => [...tsKeys.all, 'visit', id] as const,
  customers: [...tsKeys.all, 'visit-customers'] as const,
  people: [...tsKeys.all, 'visit-people'] as const,
  report: (customerId: string, month: string) => [...tsKeys.all, 'customer-report', customerId, month] as const,
};

const VISIT_COLS = 'id, worker_id, customer_id, work_date, started_at, ended_at, duration_minutes, notes, corrected_by, corrected_at';

async function withMaterials(rows: Omit<VisitRow, 'materials'>[]): Promise<VisitRow[]> {
  if (rows.length === 0) return [];
  const mats = unwrap(await db().from('ts_entry_materials').select('entry_id, item, quantity, unit, position')
    .in('entry_id', rows.map((r) => r.id)).order('position')) as (VisitMaterial & { entry_id: string })[];
  return rows.map((r) => ({ ...r, materials: mats.filter((m) => m.entry_id === r.id).map(({ item, quantity, unit }) => ({ item, quantity: Number(quantity), unit })) }));
}

export async function fetchVisits(from: IsoDate, to: IsoDate): Promise<VisitRow[]> {
  const rows = unwrap(await db().from('ts_entries').select(VISIT_COLS).gte('work_date', from).lte('work_date', to)
    .order('work_date', { ascending: false }).order('started_at', { ascending: false })) as Omit<VisitRow, 'materials'>[];
  return withMaterials(rows);
}

export async function fetchVisit(id: string): Promise<VisitRow | null> {
  const row = unwrap(await db().from('ts_entries').select(VISIT_COLS).eq('id', id).maybeSingle()) as Omit<VisitRow, 'materials'> | null;
  return row ? (await withMaterials([row]))[0] : null;
}

export const fetchCustomers = async (): Promise<NamedOption[]> =>
  unwrap(await db().from('customers').select('id, name').order('name').limit(500)) as NamedOption[];

export async function fetchPeople(): Promise<NamedOption[]> {
  const rows = unwrap(await db().from('profiles').select('id, full_name').order('full_name')) as { id: string; full_name: string | null }[];
  return rows.map((r) => ({ id: r.id, name: r.full_name || 'Unnamed' }));
}

export async function addCustomer(tenantId: string, name: string): Promise<string> {
  const row = unwrap(await db().from('customers').insert({ tenant_id: tenantId, name: name.trim() }).select('id').single()) as { id: string };
  return row.id;
}

export async function saveVisit(v: Visit, opts: { id?: string; workerId?: string }): Promise<string> {
  const p = visitPayload(v, opts);
  return unwrap(await db().rpc('ts_save_visit', p)) as string;
}

export async function deleteVisit(id: string): Promise<void> {
  unwrap(await db().from('ts_entries').delete().eq('id', id).select('id'));
}

// ---- monthly customer report ---------------------------------------------------
export type ReportLine = {
  entry_id: string; work_date: IsoDate; worker_id: string; worker_name: string; start_local: string | null; finish_local: string | null;
  duration_minutes: number; notes: string | null; materials: VisitMaterial[]; corrected_by_name: string | null;
};
export type ReportExport = { empty: true; message: string } | { empty?: false; export: FileExport; path: string; fileName: string };

export const fetchCustomerReport = async (customerId: string, month: string): Promise<ReportLine[]> =>
  unwrap(await db().rpc('ts_customer_month_report', { p_customer: customerId, p_month: `${month}-01` })) as ReportLine[];

export const runCustomerExport = (args: { customerId: string; month: string; format: 'csv' | 'pdf' }) =>
  callFunction<ReportExport>('ts-export', { report: 'customer_month', ...args }, 'The download didn’t work. Please try again.');

// ---- hooks -----------------------------------------------------------------------
export const useVisits = (from: IsoDate, to: IsoDate) => useQuery({ queryKey: keys.visits(from, to), queryFn: () => fetchVisits(from, to) });
export const useVisit = (id: string | undefined) => useQuery({ queryKey: keys.visit(id ?? '-'), queryFn: () => fetchVisit(id!), enabled: Boolean(id) });
export const useVisitCustomers = () => useQuery({ queryKey: keys.customers, queryFn: fetchCustomers, staleTime: 5 * 60_000 });
export const useVisitPeople = () => useQuery({ queryKey: keys.people, queryFn: fetchPeople, staleTime: 5 * 60_000 });
export const useCustomerReport = (customerId: string | undefined, month: string) =>
  useQuery({ queryKey: keys.report(customerId ?? '-', month), queryFn: () => fetchCustomerReport(customerId!, month), enabled: Boolean(customerId) });

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: tsKeys.all });
}

export function useSaveVisit(tenantId: string | undefined) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (a: { visit: Omit<Visit, 'customerId'> & { customerId?: string }; newCustomer?: string; id?: string; workerId?: string }) => {
      const customerId = a.visit.customerId ?? (a.newCustomer && tenantId ? await addCustomer(tenantId, a.newCustomer) : '');
      return saveVisit({ ...a.visit, customerId } as Visit, { id: a.id, workerId: a.workerId });
    },
    onSettled: invalidate,
  });
}

export function useDeleteVisit() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: deleteVisit, onSettled: invalidate });
}

export function useCustomerExport() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: runCustomerExport, onSettled: () => qc.invalidateQueries({ queryKey: fileExportsKey('timesheets') }) });
}
