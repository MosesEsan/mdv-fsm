// Pure scheduling rules (unit-tested). The database has the final say (exclusion constraint);
// these give instant feedback while the owner is filling in the form.
import { addDays, isValidTime, localDate, localTime, zonedInstant, type IsoDate } from '@/core/dates';

export type BookingLite = {
  id: string; startsAt: string; endsAt: string; status: 'scheduled' | 'cancelled'; userIds: string[];
};

export type BookingForm = { date: IsoDate; start: string; end: string; userIds: string[]; jobId: string | null };

/** Same-day bookings in v1: start and finish on the chosen date, in the business's time zone. */
export function formProblems(f: BookingForm): string[] {
  const out: string[] = [];
  if (!f.jobId) out.push('Pick a job');
  if (!isValidTime(f.start)) out.push('Enter a start time like 08:30');
  if (!isValidTime(f.end)) out.push('Enter a finish time like 16:30');
  if (isValidTime(f.start) && isValidTime(f.end) && toMinutes(f.end) <= toMinutes(f.start)) out.push('The finish time must be after the start time');
  if (f.userIds.length === 0) out.push('Pick at least one person');
  return out;
}

const toMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

export function formToRange(f: BookingForm, timeZone: string): { startsAt: Date; endsAt: Date } {
  return { startsAt: zonedInstant(f.date, f.start, timeZone), endsAt: zonedInstant(f.date, f.end, timeZone) };
}

/** Fill the form from a stored booking. */
export function bookingToForm(b: { startsAt: string; endsAt: string; userIds: string[]; jobId: string }, timeZone: string): BookingForm {
  const s = new Date(b.startsAt);
  const e = new Date(b.endsAt);
  return { date: localDate(s, timeZone), start: localTime(s, timeZone), end: localTime(e, timeZone), userIds: b.userIds, jobId: b.jobId };
}

/** Bookings (already loaded) that would clash for any of these people. */
export function clashesFor(bookings: BookingLite[], userIds: string[], startsAt: Date, endsAt: Date, ignoreId?: string): BookingLite[] {
  return bookings.filter((b) =>
    b.status === 'scheduled' && b.id !== ignoreId
    && b.userIds.some((u) => userIds.includes(u))
    && new Date(b.startsAt).getTime() < endsAt.getTime()
    && new Date(b.endsAt).getTime() > startsAt.getTime());
}

/** Bookings grouped by local start date (sorted by time), for each day of the given list. */
export function byDay<T extends { startsAt: string }>(items: T[], days: IsoDate[], timeZone: string): Record<IsoDate, T[]> {
  const out: Record<IsoDate, T[]> = Object.fromEntries(days.map((d) => [d, [] as T[]]));
  for (const item of [...items].sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
    const d = localDate(new Date(item.startsAt), timeZone);
    if (out[d]) out[d].push(item);
  }
  return out;
}

/** UTC bounds for loading a run of local days (from the first day's midnight to the day after the last). */
export function rangeForDays(days: IsoDate[], timeZone: string): { from: string; to: string } {
  return {
    from: zonedInstant(days[0], '00:00', timeZone).toISOString(),
    to: zonedInstant(addDays(days[days.length - 1], 1), '00:00', timeZone).toISOString(),
  };
}

export const timeLabel = (iso: string, timeZone: string) => localTime(new Date(iso), timeZone);
