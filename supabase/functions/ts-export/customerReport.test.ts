import { describe, expect, it } from 'vitest';
import {
  buildCustomerCsv, customerReportFileName, customerReportTable, dayLabel, monthLabel, reportTotals,
  validateCustomerReportRequest, type VisitRow,
} from './customerReport.ts';

const v = (over: Partial<VisitRow>): VisitRow => ({
  entry_id: 'e', work_date: '2026-10-07', worker_id: 'j', worker_name: 'Jack', start_local: '09:00', finish_local: '12:00',
  duration_minutes: 180, notes: 'Replaced downlights', materials: [], corrected_by_name: null, ...over,
});
const ID = '11111111-1111-4111-8111-111111111111';

describe('customer report request', () => {
  it('needs a customer, a month and a format', () => {
    expect(validateCustomerReportRequest({ customerId: ID, month: '2026-10', format: 'pdf' })).toEqual({ report: 'customer_month', customerId: ID, month: '2026-10', format: 'pdf' });
    expect(validateCustomerReportRequest({ customerId: 'x', month: '2026-10', format: 'pdf' })).toEqual({ error: 'Choose a customer' });
    expect(validateCustomerReportRequest({ customerId: ID, month: '2026-13', format: 'pdf' })).toEqual({ error: 'Choose a month' });
    expect(validateCustomerReportRequest({ customerId: ID, month: '2026-10', format: 'xls' })).toEqual({ error: 'Choose CSV or PDF' });
  });
});

describe('customer report contents', () => {
  const rows = [
    v({ entry_id: 'a', worker_id: 'm', worker_name: 'Martin', work_date: '2026-10-02', duration_minutes: 150, materials: [{ item: 'Cable', quantity: 10.5, unit: 'm' }] }),
    v({ entry_id: 'b', materials: [{ item: 'cable ', quantity: 2, unit: 'm' }, { item: 'Socket', quantity: 1, unit: 'each' }], corrected_by_name: 'Martin' }),
  ];
  it('totals hours, hours per person and materials', () => {
    const t = reportTotals(rows);
    expect(t.minutes).toBe(330);
    expect(t.perWorker).toEqual([{ name: 'Jack', visits: 1, minutes: 180 }, { name: 'Martin', visits: 1, minutes: 150 }]);
    expect(t.materials).toEqual([{ item: 'Cable', unit: 'm', quantity: 12.5 }, { item: 'Socket', unit: 'each', quantity: 1 }]);
  });
  it('CSV has one line per visit', () => {
    const raw = buildCustomerCsv(rows);
    expect(raw.startsWith('\uFEFF')).toBe(true);
    const csv = raw.trim().split('\r\n');
    expect(csv.length).toBe(3);
    expect(csv[0]).toBe('Date,Person,Work done,Start,Finish,Hours,Materials,Corrected by');
    expect(csv[2]).toBe('2026-10-07,Jack,Replaced downlights,09:00,12:00,3.00,cable  × 2 m; Socket × 1 each,Martin');
  });
  it('PDF keeps each visit together with its materials and correction', () => {
    const spec = customerReportTable(rows, { businessName: 'MDC Electrical', customerName: 'Harbourside Hotel', month: '2026-10', generatedAt: 'now' });
    expect(spec.title).toBe('Harbourside Hotel — October 2026');
    expect(spec.groups[1].map((r) => r.cells[2])).toEqual(['Replaced downlights', '  cable  × 2 m', '  Socket × 1 each', '  Corrected by Martin']);
    expect(spec.total?.cells[4]).toBe('5.50');
    expect(spec.pageNumbers).toBe(true);
  });
  it('labels', () => {
    expect(monthLabel('2026-10')).toBe('October 2026');
    expect(dayLabel('2026-10-07')).toBe('Wed 7 Oct');
    expect(customerReportFileName("Brennan's Bar", '2026-10', 'csv')).toBe('brennan-s-bar_2026-10.csv');
  });
});
