import { describe, expect, it } from 'vitest';
import { quoteHtml } from '../quoteHtml';
import { lineProblems, linesFromRooms, parseAmount, totals, type PriceItem } from '../quoteRules';

const prices: PriceItem[] = [{ id: 'p1', kind: 'floor', name: 'Engineered oak', unit: 'm2', unit_price: 45.5, active: true, sort_order: 0 }];

describe('quotes', () => {
  it('reads prices the way people type them', () => {
    expect(parseAmount('€45,50')).toBe(45.5);
    expect(parseAmount(' 12 ')).toBe(12);
    expect(parseAmount('')).toBeNull();
    expect(Number.isNaN(parseAmount('45.555') as number)).toBe(true);
  });
  it('works out totals like the database (692.85 + 13.5% = 786.38)', () => {
    expect(totals([{ quantity: '14.7', unitPrice: '45.50' }, { quantity: '2', unitPrice: '12' }], 13.5)).toEqual({ subtotal: 692.85, vat: 93.53, total: 786.38 });
    expect(totals([{ quantity: '1', unitPrice: '10' }], null)).toEqual({ subtotal: 10, vat: 0, total: 10 });
  });
  it('starts lines from the measured rooms, priced from the matching floor', () => {
    const lines = linesFromRooms([{ name: 'Kitchen', area_m2: 14.7, floor_type: 'engineered oak' }, { name: 'Hall', area_m2: 6, floor_type: 'Tiles' }, { name: 'X', area_m2: null, floor_type: null }], prices);
    expect(lines.map((l) => [l.description, l.quantity, l.unitPrice])).toEqual([['Kitchen – engineered oak', '14.7', '45.50'], ['Hall – Tiles', '6', '']]);
    expect(lineProblems(lines)).toEqual(['Line 2: enter a price like 45.50']);
  });
  it('builds a safe PDF page with the business, customer and totals', () => {
    const html = quoteHtml({
      business: { name: 'Demo <Floors>', vatNumber: 'IE123' }, customer: { name: 'Mary' }, job: { summary: 'Oak floor' },
      number: 7, date: 'Mon 2 Nov 2026', lines: [{ key: 'a', description: 'Kitchen', quantity: '14.7', unit: 'm2', unitPrice: '45.50' }], vatRate: 13.5,
    });
    expect(html).toContain('Demo &lt;Floors&gt;');
    expect(html).toContain('No. 7');
    expect(html).toContain('VAT 13.5%');
    expect(html).toContain('VAT no. IE123');
    expect(html).not.toContain('<Floors>');
  });
});
