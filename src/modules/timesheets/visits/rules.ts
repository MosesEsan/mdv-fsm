// Pure helpers for the visit screens (unit-tested).
import { formatMinutes, isValidTime, type IsoDate } from '@/core/dates';
import { materialSchema, parseQuantity, visitSchema, type MaterialUnit } from '../schemas/visit';

export type MaterialDraft = { item: string; quantity: string; unit: MaterialUnit };
export type VisitDraft = {
  date: IsoDate; start: string; finish: string; customerId: string | null; newCustomer: string; workDone: string; materials: MaterialDraft[];
};

/** "08:00"–"10:30" → 150, or null while the times are incomplete. */
export function draftMinutes(start: string, finish: string): number | null {
  if (!isValidTime(start) || !isValidTime(finish)) return null;
  const m = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const d = m(finish) - m(start);
  return d > 0 ? d : null;
}

/** "2.50 h" style label used across the visit screens. */
export const hoursLabel = (minutes: number) => `${(minutes / 60).toFixed(2)} h`;
export const hoursAndMinutes = (minutes: number) => formatMinutes(minutes);

/** Problems in the form, in the order they're shown above Save. `instants` turns the typed times into real times. */
export function visitProblems(d: VisitDraft, today: IsoDate, instants: (date: IsoDate, s: string, f: string) => { startedAt: Date; endedAt: Date }): string[] {
  const out: string[] = [];
  if (!d.customerId && !d.newCustomer.trim()) out.push('Choose a customer, or add a new one.');
  if (d.date > today) out.push('Visits can’t be logged for a future day.');
  if (!isValidTime(d.start) || !isValidTime(d.finish)) out.push('Enter the start and finish times, like 08:30.');
  else {
    const { startedAt, endedAt } = instants(d.date, d.start, d.finish);
    const r = visitSchema.safeParse({ customerId: '00000000-0000-4000-8000-000000000000', startedAt, endedAt, workDone: d.workDone, materials: [] });
    if (!r.success) for (const i of r.error.issues) if (i.path[0] === 'endedAt') out.push(i.message);
  }
  if (!d.workDone.trim()) out.push('Add a short note of the work done.');
  else if (d.workDone.trim().length > 500) out.push('Keep the work done note under 500 characters.');
  d.materials.forEach((m, i) => {
    const q = parseQuantity(m.quantity);
    const r = materialSchema.safeParse({ item: m.item, quantity: q ?? Number.NaN, unit: m.unit });
    if (!r.success) {
      const msg = q === null ? 'Add a quantity.' : r.error.issues[0].message;
      out.push(`Material ${i + 1}: ${msg}`);
    }
  });
  return [...new Set(out)];
}

/** The materials as saved (blank rows dropped). */
export const cleanMaterials = (list: MaterialDraft[]) =>
  list.filter((m) => m.item.trim() || m.quantity.trim()).map((m) => ({ item: m.item.trim(), quantity: parseQuantity(m.quantity) ?? 0, unit: m.unit }));

/** Unit used last time for an item typed before ("LED downlight" → each). */
export function rememberedUnit(item: string, past: { item: string; unit: MaterialUnit }[]): MaterialUnit | null {
  const k = item.trim().toLowerCase();
  if (!k) return null;
  return past.find((p) => p.item.trim().toLowerCase() === k)?.unit ?? null;
}

/** Most recently visited customers first, no repeats. */
export function recentCustomers(visits: { customer_id: string | null; work_date: IsoDate }[], limit = 4): string[] {
  const seen: string[] = [];
  for (const v of [...visits].sort((a, b) => b.work_date.localeCompare(a.work_date))) {
    if (v.customer_id && !seen.includes(v.customer_id)) seen.push(v.customer_id);
    if (seen.length === limit) break;
  }
  return seen;
}

/** "2026-10" → previous/next month. */
export function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IE', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 1)));
}
export const monthBounds = (month: string): { from: IsoDate; to: IsoDate } => {
  const next = shiftMonth(month, 1);
  const [y, m] = next.split('-').map(Number);
  const last = new Date(Date.UTC(y, m - 1, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
};
