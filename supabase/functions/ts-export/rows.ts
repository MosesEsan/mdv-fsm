// Timesheets export: the module's own pieces (request, columns, per-person summary). Pure.
import { decimalHours, toCsv } from '../_shared/csv.ts';
import { periodProblem } from '../_shared/dates.ts';
import type { PdfRow, TablePdf } from '../_shared/pdf/table.ts';

export type ExportFormat = 'csv' | 'pdf';

/** One row from public.ts_export_rows(). */
export type ExportRow = {
  tenant_id: string;
  week_id: string;
  week_start: string;
  week_status: string;
  worker_id: string;
  worker_name: string;
  work_date: string;
  start_local: string | null;
  finish_local: string | null;
  break_minutes: number;
  duration_minutes: number;
  rounded_minutes: number;
  job_label: string | null;
  cost_code_label: string | null;
  notes: string | null;
  source: string;
  week_total_minutes: number;
  week_rounded_minutes: number;
  week_normal_minutes: number;
  week_overtime_minutes: number;
};

export type ExportRequest = { from: string; to: string; format: ExportFormat; includeExported: boolean };

export function validateExportRequest(body: unknown): ExportRequest | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Invalid request' };
  const b = body as Record<string, unknown>;
  const problem = periodProblem(b.from, b.to);
  if (problem) return { error: problem };
  if (b.format !== 'csv' && b.format !== 'pdf') return { error: 'Choose CSV or PDF' };
  return { from: b.from as string, to: b.to as string, format: b.format, includeExported: b.includeExported === true };
}

export const exportFileName = (from: string, to: string, format: ExportFormat) => `timesheets_${from}_to_${to}.${format}`;

export const CSV_HEADER = [
  'Person', 'Week starting', 'Date', 'Start', 'Finish', 'Break (min)',
  'Hours', 'Hours (exact)', 'Job', 'Work category', 'Notes', 'Recorded by', 'Week status',
];

/** One line per entry. */
export function buildEntriesCsv(rows: ExportRow[]): string {
  return toCsv(CSV_HEADER, rows.map((r) => [
    r.worker_name, r.week_start, r.work_date, r.start_local, r.finish_local, r.break_minutes,
    decimalHours(r.rounded_minutes), decimalHours(r.duration_minutes),
    r.job_label, r.cost_code_label, r.notes,
    r.source === 'clock' ? 'Clock in/out' : 'Typed in',
    r.week_status === 'exported' ? 'Exported before' : 'Signed off',
  ]));
}

export type WeekSummary = { weekStart: string; entries: number; minutes: number; normal: number; overtime: number };
export type PersonSummary = { workerId: string; name: string; weeks: WeekSummary[]; minutes: number; normal: number; overtime: number };
export type ExportSummary = { people: PersonSummary[]; minutes: number; normal: number; overtime: number; weekCount: number; entryCount: number };

/** Per person, per week totals (rounded minutes; normal/overtime from the weekly view). */
export function summarise(rows: ExportRow[]): ExportSummary {
  const people = new Map<string, PersonSummary>();
  const weeks = new Map<string, WeekSummary>();
  for (const r of rows) {
    let person = people.get(r.worker_id);
    if (!person) {
      person = { workerId: r.worker_id, name: r.worker_name, weeks: [], minutes: 0, normal: 0, overtime: 0 };
      people.set(r.worker_id, person);
    }
    let week = weeks.get(r.week_id);
    if (!week) {
      week = { weekStart: r.week_start, entries: 0, minutes: r.week_rounded_minutes, normal: r.week_normal_minutes, overtime: r.week_overtime_minutes };
      weeks.set(r.week_id, week);
      person.weeks.push(week);
      person.minutes += week.minutes;
      person.normal += week.normal;
      person.overtime += week.overtime;
    }
    week.entries++;
  }
  const list = [...people.values()]
    .map((p) => ({ ...p, weeks: [...p.weeks].sort((a, b) => a.weekStart.localeCompare(b.weekStart)) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    people: list,
    minutes: list.reduce((s, p) => s + p.minutes, 0),
    normal: list.reduce((s, p) => s + p.normal, 0),
    overtime: list.reduce((s, p) => s + p.overtime, 0),
    weekCount: weeks.size,
    entryCount: rows.length,
  };
}

/** The summary as a generic table document (core PDF layout does the drawing). */
export function summaryTable(summary: ExportSummary, meta: { businessName: string; from: string; to: string; generatedAt: string; roundingNote: string }): TablePdf {
  const h = decimalHours;
  return {
    title: `Timesheets — ${meta.businessName}`,
    subtitle: [`Weeks starting ${meta.from} to ${meta.to} · signed-off hours`, `Created ${meta.generatedAt} · ${meta.roundingNote}`],
    columns: [
      { header: 'Person', width: 210 },
      { header: 'Week starting', width: 110 },
      { header: 'Hours', width: 70, align: 'right' },
      { header: 'Normal', width: 70, align: 'right' },
      { header: 'Overtime', width: 70, align: 'right' },
    ],
    groups: summary.people.map((p) => {
      const rows: PdfRow[] = p.weeks.map((w, i) => ({ cells: [i === 0 ? p.name : null, w.weekStart, h(w.minutes), h(w.normal), h(w.overtime)], boldCells: [0] }));
      if (p.weeks.length > 1) rows.push({ cells: [null, 'Total', h(p.minutes), h(p.normal), h(p.overtime)], bold: true });
      return rows;
    }),
    total: { cells: [`Everyone (${summary.people.length} people, ${summary.weekCount} weeks)`, null, h(summary.minutes), h(summary.normal), h(summary.overtime)], bold: true },
  };
}
