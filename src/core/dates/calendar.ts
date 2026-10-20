// Calendar helpers shared by every module. Calendar dates are 'YYYY-MM-DD' strings (no time zone);
// instants are Dates. Local dates use the tenant's time zone (tenants.timezone).

export const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

export type IsoDate = string; // 'YYYY-MM-DD'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function parseIsoDate(d: IsoDate): Date {
  if (!DATE_RE.test(d)) throw new Error(`Invalid date ${d}`);
  return new Date(`${d}T00:00:00Z`);
}

export function addDays(d: IsoDate, days: number): IsoDate {
  const date = parseIsoDate(d);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** ISO weekday: Monday = 1 … Sunday = 7. */
export function isoWeekday(d: IsoDate): number {
  const day = parseIsoDate(d).getUTCDay();
  return day === 0 ? 7 : day;
}

/** First day of the week containing `d`, for a week starting on `weekStartsOn`. */
export function weekStartFor(d: IsoDate, weekStartsOn: WeekDay): IsoDate {
  const startDow = WEEK_DAYS.indexOf(weekStartsOn) + 1;
  return addDays(d, -((isoWeekday(d) - startDow + 7) % 7));
}

export function weekDays(weekStart: IsoDate): IsoDate[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

/** The calendar date of an instant in a time zone. */
export function localDate(instant: Date, timeZone: string): IsoDate {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
}

/** 'HH:MM' of an instant in a time zone. */
export function localTime(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(instant);
}

export function today(timeZone: string): IsoDate {
  return localDate(new Date(), timeZone);
}

function offsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

/** The instant for a local date + 'HH:MM' in a time zone (handles summer time). */
export function zonedInstant(date: IsoDate, time: string, timeZone: string): Date {
  const m = TIME_RE.exec(time);
  if (!m) throw new Error('Enter a time like 08:30');
  parseIsoDate(date); // validates
  const [y, mo, d] = date.split('-').map(Number);
  const naive = Date.UTC(y, mo - 1, d, Number(m[1]), Number(m[2]));
  // Two passes settle the offset across DST changes.
  let instant = new Date(naive - offsetMinutes(new Date(naive), timeZone) * 60_000);
  instant = new Date(naive - offsetMinutes(instant, timeZone) * 60_000);
  return instant;
}

/** Start/finish instants for a day. A finish earlier than the start means it ends the next day. */
export function shiftInstants(date: IsoDate, start: string, end: string, timeZone: string): { startedAt: Date; endedAt: Date } {
  const startedAt = zonedInstant(date, start, timeZone);
  let endedAt = zonedInstant(date, end, timeZone);
  if (endedAt.getTime() <= startedAt.getTime()) endedAt = zonedInstant(addDays(date, 1), end, timeZone);
  return { startedAt, endedAt };
}

export function isValidTime(time: string): boolean {
  return TIME_RE.test(time);
}

export function formatDay(d: IsoDate): string {
  return new Intl.DateTimeFormat('en-IE', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(parseIsoDate(d));
}
