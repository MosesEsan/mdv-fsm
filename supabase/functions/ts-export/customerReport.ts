// Timesheets: customer × month report (visit-style businesses). Pure: request, CSV, PDF layout, totals.
import { decimalHours, toCsv } from '../_shared/csv.ts';
import type { PdfRow, TablePdf } from '../_shared/pdf/table.ts';

export type Material = { item: string; quantity: number; unit: 'each' | 'm' };
/** One row from public.ts_customer_month_report(). */
export type VisitRow = {
  entry_id: string;
  work_date: string;
  worker_id: string;
  worker_name: string;
  start_local: string | null;
  finish_local: string | null;
  duration_minutes: number;
  notes: string | null;
  materials: Material[];
  corrected_by_name: string | null;
};

export type CustomerReportRequest = { report: 'customer_month'; customerId: string; month: string; format: 'csv' | 'pdf' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateCustomerReportRequest(body: unknown): CustomerReportRequest | { error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.customerId !== 'string' || !UUID.test(b.customerId)) return { error: 'Choose a customer' };
  if (typeof b.month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(b.month)) return { error: 'Choose a month' };
  if (b.format !== 'csv' && b.format !== 'pdf') return { error: 'Choose CSV or PDF' };
  return { report: 'customer_month', customerId: b.customerId, month: b.month, format: b.format };
}

export const quantityText = (m: Material) => `${Number(m.quantity)} ${m.unit === 'each' ? 'each' : 'm'}`;
export const materialsText = (list: Material[]) => list.map((m) => `${m.item} × ${quantityText(m)}`).join('; ');

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IE', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 1)));
}
/** "2026-10-07" → "Wed 7 Oct" */
export function dayLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IE', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, m - 1, d))).replace(',', '');
}

export type ReportTotals = {
  visits: number;
  minutes: number;
  perWorker: { name: string; visits: number; minutes: number }[];
  materials: Material[];
};

export function reportTotals(rows: VisitRow[]): ReportTotals {
  const people = new Map<string, { name: string; visits: number; minutes: number }>();
  const mats = new Map<string, Material>();
  for (const r of rows) {
    const p = people.get(r.worker_id) ?? { name: r.worker_name, visits: 0, minutes: 0 };
    p.visits++;
    p.minutes += r.duration_minutes;
    people.set(r.worker_id, p);
    for (const m of r.materials) {
      const key = `${m.item.trim().toLowerCase()}|${m.unit}`;
      const cur = mats.get(key);
      if (cur) cur.quantity = Math.round((cur.quantity + Number(m.quantity)) * 100) / 100;
      else mats.set(key, { item: m.item.trim(), unit: m.unit, quantity: Number(m.quantity) });
    }
  }
  return {
    visits: rows.length,
    minutes: rows.reduce((s, r) => s + r.duration_minutes, 0),
    perWorker: [...people.values()].sort((a, b) => a.name.localeCompare(b.name)),
    materials: [...mats.values()].sort((a, b) => a.item.localeCompare(b.item)),
  };
}

export const CUSTOMER_CSV_HEADER = ['Date', 'Person', 'Work done', 'Start', 'Finish', 'Hours', 'Materials', 'Corrected by'];

export function buildCustomerCsv(rows: VisitRow[]): string {
  return toCsv(CUSTOMER_CSV_HEADER, rows.map((r) => [
    r.work_date, r.worker_name, r.notes, r.start_local, r.finish_local, decimalHours(r.duration_minutes),
    materialsText(r.materials), r.corrected_by_name,
  ]));
}

export const customerReportFileName = (customer: string, month: string, format: 'csv' | 'pdf') =>
  `${customer.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'customer'}_${month}.${format}`;

/** A4 layout: one group per visit (never split across pages), then totals. */
export function customerReportTable(rows: VisitRow[], meta: { businessName: string; customerName: string; month: string; generatedAt: string }): TablePdf {
  const h = decimalHours;
  const t = reportTotals(rows);
  const visitGroups: PdfRow[][] = rows.map((r) => {
    const lines: PdfRow[] = [{
      cells: [dayLabel(r.work_date), r.worker_name, r.notes ?? '', `${r.start_local ?? ''}–${r.finish_local ?? ''}`, h(r.duration_minutes)],
    }];
    for (const m of r.materials) lines.push({ cells: [null, null, `  ${m.item} × ${quantityText(m)}`, null, null] });
    if (r.corrected_by_name) lines.push({ cells: [null, null, `  Corrected by ${r.corrected_by_name}`, null, null] });
    return lines;
  });
  const totals: PdfRow[] = [
    { cells: ['Hours per person', null, null, null, null], bold: true },
    ...t.perWorker.map((p) => ({ cells: [null, p.name, `${p.visits} visit${p.visits === 1 ? '' : 's'}`, null, h(p.minutes)] })),
  ];
  const materialTotals: PdfRow[] = t.materials.length
    ? [{ cells: ['Materials used', null, null, null, null], bold: true }, ...t.materials.map((m) => ({ cells: [null, null, m.item, null, quantityText(m)] }))]
    : [];
  return {
    title: `${meta.customerName} — ${monthLabel(meta.month)}`,
    subtitle: [`${meta.businessName} · ${t.visits} visit${t.visits === 1 ? '' : 's'}`, `Created ${meta.generatedAt}`],
    columns: [
      { header: 'Date', width: 70 },
      { header: 'Person', width: 70 },
      { header: 'Work done', width: 230 },
      { header: 'Time', width: 75 },
      { header: 'Hours', width: 55, align: 'right' },
    ],
    groups: [...visitGroups, totals, ...(materialTotals.length ? [materialTotals] : [])],
    total: { cells: ['Total hours', null, null, null, h(t.minutes)], bold: true },
    pageNumbers: true,
  };
}
