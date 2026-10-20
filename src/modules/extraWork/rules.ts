// Pure rules for extra work (unit-tested). The database checks the same limits.
export type ExtraForm = { what: string; why: string; hours: string; materials: string };
export const emptyExtraForm = (): ExtraForm => ({ what: '', why: '', hours: '', materials: '' });

/** "1.5", "1,5" or "" → 1.5 / null. Returns NaN when it isn't a number. */
export function parseHours(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (!t) return null;
  return /^\d{1,2}(\.\d)?$/.test(t) ? Number(t) : NaN;
}

export function extraProblems(f: ExtraForm): string[] {
  const out: string[] = [];
  if (!f.what.trim()) out.push('Say what the extra work was');
  else if (f.what.trim().length > 300) out.push('Keep "what" to 300 characters');
  if (f.why.length > 1000) out.push('Keep "why" to 1,000 characters');
  if (f.materials.length > 500) out.push('Keep materials to 500 characters');
  const h = parseHours(f.hours);
  if (h !== null && (Number.isNaN(h) || h <= 0 || h > 24)) out.push('Hours should be a number like 1.5, up to 24');
  return out;
}

export function extraValues(f: ExtraForm) {
  const t = (s: string) => s.trim() || null;
  return { what: f.what.trim(), why: t(f.why), hours: parseHours(f.hours), materials: t(f.materials) };
}

/** "2.5 hrs · copper pipe, 2 elbows" */
export function extraDetailLine(e: { hours: number | null; materials: string | null }): string {
  return [e.hours != null ? `${e.hours} hr${e.hours === 1 ? '' : 's'}` : null, e.materials].filter(Boolean).join(' · ');
}

export const openLabel = (n: number) => `${n} extra to invoice`;
