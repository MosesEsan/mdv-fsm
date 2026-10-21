import { describe, expect, it } from 'vitest';
import { cleanMaterials, draftMinutes, monthBounds, recentCustomers, rememberedUnit, shiftMonth, visitProblems, type VisitDraft } from '../visits/rules';

const instants = (date: string, s: string, f: string) => ({ startedAt: new Date(`${date}T${s}:00Z`), endedAt: new Date(`${date}T${f}:00Z`) });
const ok: VisitDraft = { date: '2026-10-20', start: '08:00', finish: '10:30', customerId: 'c1', newCustomer: '', workDone: 'Fixed', materials: [] };

describe('visit form rules', () => {
  it('works out the hours while typing', () => {
    expect(draftMinutes('08:00', '10:30')).toBe(150);
    expect(draftMinutes('10:30', '08:00')).toBe(null);
    expect(draftMinutes('8', '10:30')).toBe(null);
  });
  it('accepts a complete visit', () => {
    expect(visitProblems(ok, '2026-10-20', instants)).toEqual([]);
  });
  it('lists every problem in order', () => {
    expect(visitProblems({ ...ok, customerId: null, finish: '07:00', workDone: '' }, '2026-10-20', instants)).toEqual([
      'Choose a customer, or add a new one.', 'Finish time must be after the start time.', 'Add a short note of the work done.',
    ]);
    expect(visitProblems({ ...ok, date: '2026-10-21' }, '2026-10-20', instants)).toEqual(['Visits can’t be logged for a future day.']);
    expect(visitProblems({ ...ok, start: '05:00', finish: '22:00' }, '2026-10-20', instants)).toEqual(['That’s over 16 hours. Check the times.']);
  });
  it('a new customer name counts as a customer', () => {
    expect(visitProblems({ ...ok, customerId: null, newCustomer: 'Quay Hotel' }, '2026-10-20', instants)).toEqual([]);
  });
  it('checks each material', () => {
    const p = visitProblems({ ...ok, materials: [{ item: 'Socket', quantity: '1.5', unit: 'each' }, { item: 'Cable', quantity: '', unit: 'm' }] }, '2026-10-20', instants);
    expect(p).toEqual(['Material 1: Items counted “each” need a whole number.', 'Material 2: Add a quantity.']);
  });
  it('drops blank material rows', () => {
    expect(cleanMaterials([{ item: ' ', quantity: '', unit: 'each' }, { item: 'Cable ', quantity: '2,5', unit: 'm' }])).toEqual([{ item: 'Cable', quantity: 2.5, unit: 'm' }]);
  });
  it('remembers units and recent customers', () => {
    expect(rememberedUnit('led downlight', [{ item: 'LED downlight', unit: 'each' }])).toBe('each');
    expect(rememberedUnit('new', [])).toBe(null);
    expect(recentCustomers([{ customer_id: 'a', work_date: '2026-10-01' }, { customer_id: 'b', work_date: '2026-10-05' }, { customer_id: 'a', work_date: '2026-10-07' }]))
      .toEqual(['a', 'b']);
  });
  it('months', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(monthBounds('2026-02')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });
});
