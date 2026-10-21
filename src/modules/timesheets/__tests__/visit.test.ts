import { describe, expect, it } from 'vitest';
import { materialSchema, materialTotals, parseQuantity, visitPayload, visitSchema } from '../schemas/visit';

const CUST = '11111111-1111-4111-8111-111111111111';
const at = (h: number, m = 0) => new Date(2026, 9, 13, h, m);
const base = { customerId: CUST, startedAt: at(9), endedAt: at(11, 30), workDone: 'Replaced downlights', materials: [] };
const msgs = (r: { success: boolean; error?: { issues: { message: string }[] } }) => (r.success ? [] : r.error!.issues.map((i) => i.message));

describe('materials', () => {
  it('accepts whole numbers for each and 2 decimals for metres', () => {
    expect(materialSchema.safeParse({ item: 'Socket', quantity: 4, unit: 'each' }).success).toBe(true);
    expect(materialSchema.safeParse({ item: 'Cable', quantity: 12.5, unit: 'm' }).success).toBe(true);
    expect(materialSchema.safeParse({ item: 'Cable', quantity: 0.05, unit: 'm' }).success).toBe(true);
  });
  it('refuses bad quantities with plain messages', () => {
    expect(msgs(materialSchema.safeParse({ item: 'Socket', quantity: 1.5, unit: 'each' }))).toContain('Items counted “each” need a whole number.');
    expect(msgs(materialSchema.safeParse({ item: 'Cable', quantity: 1.234, unit: 'm' }))).toContain('Use up to 2 decimal places for metres.');
    expect(msgs(materialSchema.safeParse({ item: 'Cable', quantity: 0, unit: 'm' }))).toContain('Quantity must be more than 0.');
    expect(msgs(materialSchema.safeParse({ item: 'Cable', quantity: -2, unit: 'm' }))).toContain('Quantity must be more than 0.');
    expect(msgs(materialSchema.safeParse({ item: '  ', quantity: 1, unit: 'each' }))).toContain('Add the item name.');
  });
  it('parses typed quantities', () => {
    expect(parseQuantity('12,5')).toBe(12.5);
    expect(parseQuantity(' 3 ')).toBe(3);
    expect(parseQuantity('abc')).toBe(null);
    expect(parseQuantity('')).toBe(null);
  });
  it('totals by item and unit', () => {
    expect(materialTotals([
      { item: 'Cable', quantity: 10.25, unit: 'm' },
      { item: 'cable ', quantity: 2.5, unit: 'm' },
      { item: 'Socket', quantity: 2, unit: 'each' },
    ])).toEqual([
      { item: 'Cable', unit: 'm', quantity: 12.75 },
      { item: 'Socket', unit: 'each', quantity: 2 },
    ]);
  });
});

describe('visit', () => {
  it('accepts a normal visit', () => {
    expect(visitSchema.safeParse(base).success).toBe(true);
  });
  it('needs a customer, work done and sensible times', () => {
    expect(msgs(visitSchema.safeParse({ ...base, customerId: '' }))).toContain('Choose a customer, or add a new one.');
    expect(msgs(visitSchema.safeParse({ ...base, workDone: ' ' }))).toContain('Add a short note of the work done.');
    expect(msgs(visitSchema.safeParse({ ...base, workDone: 'a'.repeat(501) }))).toContain('Keep the work done note under 500 characters.');
    expect(msgs(visitSchema.safeParse({ ...base, endedAt: at(8) }))).toContain('Finish time must be after the start time.');
    expect(msgs(visitSchema.safeParse({ ...base, startedAt: at(5), endedAt: at(22) }))).toContain('That’s over 16 hours. Check the times.');
  });
  it('builds the server payload', () => {
    const v = visitSchema.parse({ ...base, workDone: ' Fixed ', materials: [{ item: ' Socket ', quantity: 2, unit: 'each' }] });
    const p = visitPayload(v, { id: 'e1' });
    expect(p.p_entry).toMatchObject({ id: 'e1', customer_id: CUST, notes: 'Fixed', worker_id: null });
    expect(p.p_materials).toEqual([{ item: 'Socket', quantity: 2, unit: 'each' }]);
  });
});
