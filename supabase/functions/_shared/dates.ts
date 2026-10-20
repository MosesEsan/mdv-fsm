// Date checks for requests (pure).
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(v: unknown): v is string {
  return typeof v === 'string' && DATE_RE.test(v) && !Number.isNaN(Date.parse(v));
}

/** Plain-English problem with a from/to period, or null. */
export function periodProblem(from: unknown, to: unknown, maxDays = 400): string | null {
  if (!isIsoDate(from) || !isIsoDate(to)) return 'Pick a start and end date';
  if (to < from) return 'The end date is before the start date';
  if ((Date.parse(to) - Date.parse(from)) / 86_400_000 > maxDays) return 'Pick a period of about a year or less';
  return null;
}
