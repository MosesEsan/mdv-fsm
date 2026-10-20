// Pure measuring rules (unit-tested). The database works out area the same way.

/** Reads "4.2", "4,2" or " 4.20 m" as metres; empty → null; nonsense → NaN. */
export function parseMetres(text: string): number | null {
  const t = text.trim().replace(/m$/i, '').trim().replace(',', '.');
  if (t === '') return null;
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
}

export const roundTo = (n: number, places = 2) => Math.round(n * 10 ** places) / 10 ** places;

export type RoomInput = { name: string; length: string; width: string; area: string; floorType: string; notes: string };
export type RoomValues = { name: string; length_m: number | null; width_m: number | null; area_m2: number | null; floor_type: string | null; notes: string | null };

/** Area shown while typing: length × width if both are there, else the area typed in. */
export function previewArea(r: Pick<RoomInput, 'length' | 'width' | 'area'>): number | null {
  const l = parseMetres(r.length);
  const w = parseMetres(r.width);
  if (l && w && !Number.isNaN(l) && !Number.isNaN(w)) return roundTo(l * w);
  const a = parseMetres(r.area);
  return a && !Number.isNaN(a) ? a : null;
}

export function roomProblems(r: RoomInput): string[] {
  const out: string[] = [];
  if (!r.name.trim()) out.push('Give the room a name');
  for (const [label, v, max] of [['Length', r.length, 200], ['Width', r.width, 200], ['Area', r.area, 10000]] as const) {
    const n = parseMetres(v);
    if (n !== null && (Number.isNaN(n) || n <= 0 || n > max)) out.push(`${label} must be a number like 4.2`);
  }
  if ((parseMetres(r.length) === null) !== (parseMetres(r.width) === null)) out.push('Enter both length and width, or just the area');
  return out;
}

export function roomValues(r: RoomInput): RoomValues {
  const l = parseMetres(r.length);
  const w = parseMetres(r.width);
  return {
    name: r.name.trim(), length_m: l, width_m: w, area_m2: l && w ? roundTo(l * w) : parseMetres(r.area),
    floor_type: r.floorType.trim() || null, notes: r.notes.trim() || null,
  };
}

export const totalArea = (rooms: { area_m2: number | null }[]) => roundTo(rooms.reduce((s, r) => s + (Number(r.area_m2) || 0), 0));
