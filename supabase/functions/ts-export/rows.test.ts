import { describe, expect, it } from 'vitest';
import { buildEntriesCsv, summarise, summaryTable, validateExportRequest, type ExportRow } from './rows.ts';

const row = (over: Partial<ExportRow>): ExportRow => ({
  tenant_id: 't', week_id: 'w1', week_start: '2026-10-05', week_status: 'approved',
  worker_id: 'a', worker_name: 'Aoife', work_date: '2026-10-06', start_local: '08:00', finish_local: '16:30',
  break_minutes: 30, duration_minutes: 480, rounded_minutes: 480, job_label: 'Plot 7', cost_code_label: null,
  notes: null, source: 'manual', week_total_minutes: 480, week_rounded_minutes: 480,
  week_normal_minutes: 480, week_overtime_minutes: 0, ...over,
});

describe('timesheets export request', () => {
  it('accepts a valid request and rejects bad ones', () => {
    expect(validateExportRequest({ from: '2026-10-05', to: '2026-10-18', format: 'pdf' }))
      .toEqual({ from: '2026-10-05', to: '2026-10-18', format: 'pdf', includeExported: false });
    expect('error' in validateExportRequest({ from: '2026-10-05', to: '2026-10-18', format: 'xlsx' })).toBe(true);
    expect('error' in validateExportRequest(null)).toBe(true);
  });
});

describe('timesheets csv', () => {
  it('one line per entry, Irish names intact', () => {
    const csv = buildEntriesCsv([row({ worker_name: 'Seán Ó Brien', notes: 'Fixed skirting, hall' })]);
    expect(csv.startsWith('\uFEFFPerson,Week starting,Date')).toBe(true);
    const lines = csv.trim().split('\r\n');
    expect(lines[1]).toBe('Seán Ó Brien,2026-10-05,2026-10-06,08:00,16:30,30,8.00,8.00,Plot 7,,"Fixed skirting, hall",Typed in,Signed off');
  });
});

describe('timesheets summary', () => {
  const s = summarise([
    row({ week_id: 'w1', week_rounded_minutes: 2400, week_normal_minutes: 2340, week_overtime_minutes: 60 }),
    row({ week_id: 'w1', work_date: '2026-10-07', week_rounded_minutes: 2400, week_normal_minutes: 2340, week_overtime_minutes: 60 }),
    row({ week_id: 'w2', week_start: '2026-10-12', week_rounded_minutes: 600, week_normal_minutes: 600, week_overtime_minutes: 0 }),
    row({ worker_id: 'b', worker_name: 'Brian', week_id: 'w3', week_rounded_minutes: 300, week_normal_minutes: 300, week_overtime_minutes: 0 }),
  ]);
  it('totals per person and week, each week counted once', () => {
    expect(s.people.map((p) => p.name)).toEqual(['Aoife', 'Brian']);
    expect(s.people[0]).toMatchObject({ minutes: 3000, normal: 2940, overtime: 60 });
    expect(s.people[0].weeks.map((w) => w.entries)).toEqual([2, 1]);
    expect(s).toMatchObject({ minutes: 3300, overtime: 60, weekCount: 3, entryCount: 4 });
  });
  it('table: one group per person, subtotal when more than one week, grand total', () => {
    const t = summaryTable(s, { businessName: 'Demo', from: '2026-10-05', to: '2026-10-12', generatedAt: 'now', roundingNote: 'x' });
    expect(t.groups.map((g) => g.length)).toEqual([3, 1]);
    expect(t.groups[0][2].cells).toEqual([null, 'Total', '50.00', '49.00', '1.00']);
    expect(t.total?.cells[2]).toBe('55.00');
  });
});
