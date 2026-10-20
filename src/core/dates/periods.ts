// Report periods shared by every module. Week presets follow the tenant's week start; month presets are calendar months.
import { addDays, weekStartFor, type IsoDate, type WeekDay } from './calendar';

export type PeriodPreset = 'this_week' | 'last_week' | 'last_4_weeks' | 'this_month' | 'last_month' | 'custom';
export type Period = { from: IsoDate; to: IsoDate };

export const presetLabels: Record<PeriodPreset, string> = {
  this_week: 'This week',
  last_week: 'Last week',
  last_4_weeks: 'Last 4 weeks',
  this_month: 'This month',
  last_month: 'Last month',
  custom: 'Pick dates',
};

function monthStart(d: IsoDate): IsoDate {
  return `${d.slice(0, 8)}01`;
}

function monthEnd(d: IsoDate): IsoDate {
  const [y, m] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); // day 0 of next month
}

export function periodFor(preset: Exclude<PeriodPreset, 'custom'>, today: IsoDate, weekStartsOn: WeekDay): Period {
  const thisWeek = weekStartFor(today, weekStartsOn);
  switch (preset) {
    case 'this_week':
      return { from: thisWeek, to: addDays(thisWeek, 6) };
    case 'last_week':
      return { from: addDays(thisWeek, -7), to: addDays(thisWeek, -1) };
    case 'last_4_weeks':
      return { from: addDays(thisWeek, -28), to: addDays(thisWeek, -1) };
    case 'this_month':
      return { from: monthStart(today), to: monthEnd(today) };
    case 'last_month': {
      const lastDayPrev = addDays(monthStart(today), -1);
      return { from: monthStart(lastDayPrev), to: lastDayPrev };
    }
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Plain-English problem with a custom period, or null when it's fine. */
export function periodProblem(p: Period): string | null {
  if (!DATE_RE.test(p.from) || !DATE_RE.test(p.to) || Number.isNaN(Date.parse(p.from)) || Number.isNaN(Date.parse(p.to))) {
    return 'Enter dates like 2026-10-05';
  }
  if (p.to < p.from) return 'The end date is before the start date';
  if ((Date.parse(p.to) - Date.parse(p.from)) / 86_400_000 > 400) return 'Pick a period of about a year or less';
  return null;
}
