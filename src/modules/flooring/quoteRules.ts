// Pure quote rules (unit-tested). The database works out the real totals the same way (fl_v_quotes).
import type { Room } from './api';

export type Unit = 'm2' | 'item' | 'hour' | 'metre';
export const UNITS: [Unit, string][] = [['m2', 'm²'], ['item', 'each'], ['hour', 'hour'], ['metre', 'metre']];
export const unitLabel = (u: string) => UNITS.find(([k]) => k === u)?.[1] ?? u;

export type PriceItem = { id: string; kind: 'floor' | 'extra' | 'labour'; name: string; unit: Unit; unit_price: number; active: boolean; sort_order: number };
export type LineInput = { key: string; description: string; quantity: string; unit: Unit; unitPrice: string };

/** "45,50", "€45.50", " 45.5 " → 45.5; empty → null; nonsense → NaN. */
export function parseAmount(text: string): number | null {
  const t = text.trim().replace(/^€/, '').replace(/,/g, '.').trim();
  if (t === '') return null;
  return /^\d+(\.\d{1,2})?$/.test(t) ? Number(t) : NaN;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function lineTotal(l: Pick<LineInput, 'quantity' | 'unitPrice'>): number {
  const q = parseAmount(l.quantity);
  const p = parseAmount(l.unitPrice);
  return q && p !== null && !Number.isNaN(q) && !Number.isNaN(p) ? round2(q * p) : 0;
}

export function totals(lines: Pick<LineInput, 'quantity' | 'unitPrice'>[], vatRate: number | null) {
  const subtotal = round2(lines.reduce((s, l) => s + lineTotal(l), 0));
  const vat = round2((subtotal * (vatRate ?? 0)) / 100);
  return { subtotal, vat, total: round2(subtotal + vat) };
}

export const euro = (n: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);

export function lineProblems(lines: LineInput[]): string[] {
  if (lines.length === 0) return ['Add at least one line'];
  const out: string[] = [];
  lines.forEach((l, i) => {
    const n = i + 1;
    if (!l.description.trim()) out.push(`Line ${n}: say what it is`);
    const q = parseAmount(l.quantity);
    if (q === null || Number.isNaN(q) || q <= 0) out.push(`Line ${n}: enter a quantity like 14.7`);
    const p = parseAmount(l.unitPrice);
    if (p === null || Number.isNaN(p)) out.push(`Line ${n}: enter a price like 45.50`);
  });
  return out;
}

let seq = 0;
export const newKey = () => `l${Date.now().toString(36)}${(seq++).toString(36)}`;

/** One line per measured room, priced from the matching floor in the price list when there is one. */
export function linesFromRooms(rooms: Pick<Room, 'name' | 'area_m2' | 'floor_type'>[], prices: PriceItem[]): LineInput[] {
  const floors = prices.filter((p) => p.active && p.kind === 'floor');
  return rooms.filter((r) => r.area_m2).map((r) => {
    const match = floors.find((p) => r.floor_type && p.name.trim().toLowerCase() === r.floor_type.trim().toLowerCase());
    return {
      key: newKey(),
      description: [r.name, r.floor_type].filter(Boolean).join(' – '),
      quantity: String(r.area_m2), unit: 'm2' as Unit,
      unitPrice: match ? match.unit_price.toFixed(2) : '',
    };
  });
}

export const lineFromPrice = (p: PriceItem): LineInput =>
  ({ key: newKey(), description: p.name, quantity: '1', unit: p.unit, unitPrice: p.unit_price.toFixed(2) });

export const toPayload = (lines: LineInput[]) =>
  lines.map((l) => ({ description: l.description.trim(), quantity: parseAmount(l.quantity), unit: l.unit, unit_price: parseAmount(l.unitPrice) }));

export const QUOTE_STATUS: Record<string, string> = { draft: 'Draft', sent: 'Sent', accepted: 'Accepted', declined: 'Declined' };
