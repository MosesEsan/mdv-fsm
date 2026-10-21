// A customer visit (logAgainst = 'customer') and its materials. No prices, ever.
// Server mirror: ts_entries_before_write + ts_entry_materials checks
// (supabase/migrations/20261021100100_timesheets_materials.sql, 20261021100200_timesheets_customer_visits.sql).
import { z } from 'zod';

export const MATERIAL_UNITS = ['each', 'm'] as const;
export type MaterialUnit = (typeof MATERIAL_UNITS)[number];
export const UNIT_LABELS: Record<MaterialUnit, string> = { each: 'each', m: 'metres' };

export const MAX_VISIT_MINUTES = 16 * 60;
export const MAX_WORK_DONE = 500;

const hasAtMost2dp = (n: number) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6;

export const materialSchema = z
  .object({
    item: z.string().trim().min(1, 'Add the item name.').max(120, 'Keep the item name under 120 characters.'),
    quantity: z.number({ message: 'Add a quantity.' }).refine((n) => n > 0, 'Quantity must be more than 0.'),
    unit: z.enum(MATERIAL_UNITS),
  })
  .superRefine((m, ctx) => {
    if (m.unit === 'each' && !Number.isInteger(m.quantity)) {
      ctx.addIssue({ code: 'custom', path: ['quantity'], message: 'Items counted “each” need a whole number.' });
    }
    if (m.unit === 'm' && !hasAtMost2dp(m.quantity)) {
      ctx.addIssue({ code: 'custom', path: ['quantity'], message: 'Use up to 2 decimal places for metres.' });
    }
  });
export type Material = z.output<typeof materialSchema>;

export const visitSchema = z
  .object({
    customerId: z.string().uuid({ message: 'Choose a customer, or add a new one.' }),
    startedAt: z.date(),
    endedAt: z.date(),
    workDone: z.string().trim().min(1, 'Add a short note of the work done.').max(MAX_WORK_DONE, 'Keep the work done note under 500 characters.'),
    materials: z.array(materialSchema).default([]),
  })
  .superRefine((v, ctx) => {
    const mins = (v.endedAt.getTime() - v.startedAt.getTime()) / 60000;
    if (mins <= 0) ctx.addIssue({ code: 'custom', path: ['endedAt'], message: 'Finish time must be after the start time.' });
    else if (mins > MAX_VISIT_MINUTES) ctx.addIssue({ code: 'custom', path: ['endedAt'], message: 'That’s over 16 hours. Check the times.' });
  });
export type Visit = z.output<typeof visitSchema>;

/** Parse a typed quantity ("12.5", "3") into a number, or null if it isn't one. */
export function parseQuantity(text: string): number | null {
  const t = text.trim().replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}

/** Total of each material across visits, grouped by item + unit (case-insensitive item). */
export function materialTotals(list: { item: string; quantity: number; unit: MaterialUnit }[]) {
  const map = new Map<string, { item: string; unit: MaterialUnit; quantity: number }>();
  for (const m of list) {
    const key = `${m.item.trim().toLowerCase()}|${m.unit}`;
    const cur = map.get(key);
    if (cur) cur.quantity = Math.round((cur.quantity + m.quantity) * 100) / 100;
    else map.set(key, { item: m.item.trim(), unit: m.unit, quantity: m.quantity });
  }
  return [...map.values()].sort((a, b) => a.item.localeCompare(b.item));
}

/** "4 each", "12.5 m" */
export const formatQuantity = (q: number, unit: MaterialUnit) => `${q} ${unit === 'each' ? 'each' : 'm'}`;

/** Server payload for ts_save_visit. */
export function visitPayload(v: Visit, opts: { id?: string; workerId?: string } = {}) {
  return {
    p_entry: {
      id: opts.id ?? null,
      worker_id: opts.workerId ?? null,
      started_at: v.startedAt.toISOString(),
      ended_at: v.endedAt.toISOString(),
      customer_id: v.customerId,
      notes: v.workDone.trim(),
    },
    p_materials: v.materials.map((m) => ({ item: m.item.trim(), quantity: m.quantity, unit: m.unit })),
  };
}
