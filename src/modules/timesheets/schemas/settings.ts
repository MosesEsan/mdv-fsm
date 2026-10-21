// Timesheets settings. Server mirror: private.settings_validate__timesheets() and
// private.settings_defaults__timesheets() in the module migration.
// A unit test reads the migration and checks both sets of defaults match.
import { z } from 'zod';
import { WEEK_DAYS } from '@/core/dates';
import type { SettingsFields } from '@/core/settings/fields';

/** `.default()` fills a missing key; `.catch()` replaces a value this app version doesn't understand. */
const withDefault = <T extends z.ZodType>(schema: T, value: z.output<T>) =>
  schema.default(value as never).catch(value as never) as unknown as z.ZodType<z.output<T>, z.input<T> | undefined>;

export const ROUNDING_STEPS = [0, 5, 6, 10, 15, 30, 60] as const;

export const timesheetsSettingsSchema = z.object({
  entryMode: withDefault(z.enum(['start_end', 'duration', 'clock']), 'start_end'),
  breaks: withDefault(z.enum(['off', 'fixed', 'manual']), 'off'),
  fixedBreakMinutes: withDefault(z.number().int().min(0).max(120), 30),
  approval: withDefault(z.enum(['none', 'manager', 'supervisor']), 'manager'),
  logAgainst: withDefault(z.enum(['job', 'customer', 'none']), 'job'),
  requireJob: withDefault(z.boolean(), false),
  costCodes: withDefault(z.boolean(), false),
  weekStartsOn: withDefault(z.enum(WEEK_DAYS), 'monday'),
  roundingMinutes: withDefault(z.literal(ROUNDING_STEPS), 15),
  overtimeDailyAfterMinutes: withDefault(z.number().int().min(1).max(1440).nullable(), null),
  overtimeWeeklyAfterMinutes: withDefault(z.number().int().min(1).max(10080).nullable(), 2340),
  materials: withDefault(z.enum(['off', 'optional']), 'off'),
});

export type TimesheetsSettings = z.output<typeof timesheetsSettingsSchema>;
export type EntryMode = TimesheetsSettings['entryMode'];

// Plain-English labels for the owner's Settings screen (order = display order).
export const timesheetsSettingsFields: SettingsFields<TimesheetsSettings> = {
  entryMode: {
    kind: 'choice',
    label: 'How staff record their time',
    options: [
      { value: 'start_end', label: 'Start and finish times', description: 'Staff enter when they started and finished each block of work.' },
      { value: 'duration', label: 'Total hours', description: 'Staff enter how long they worked, e.g. 8 hours.' },
      { value: 'clock', label: 'Clock in and out', description: 'Staff tap Clock in when they start and Clock out when they finish. The time comes from our server, not the phone.' },
    ],
  },
  breaks: {
    kind: 'choice',
    label: 'Breaks',
    description: 'Only applies when staff record start and finish times or clock in.',
    options: [
      { value: 'off', label: 'Not tracked' },
      { value: 'fixed', label: 'Same break every time', description: 'The same break is taken off every entry automatically.' },
      { value: 'manual', label: 'Staff enter their break' },
    ],
  },
  fixedBreakMinutes: {
    kind: 'number',
    label: 'Break length',
    min: 0,
    max: 120,
    unit: 'minutes',
    showIf: (s) => s.breaks === 'fixed',
  },
  approval: {
    kind: 'choice',
    label: 'Who signs off timesheets',
    options: [
      { value: 'none', label: 'No sign-off', description: 'A week is final as soon as the person sends it in.' },
      { value: 'manager', label: 'Owner or manager', description: 'Each week is checked by the owner or a manager.' },
      { value: 'supervisor', label: 'Each person’s supervisor', description: 'A supervisor (e.g. a foreman) checks the weeks of the people assigned to them. The owner and managers can still sign off.' },
    ],
  },
  logAgainst: {
    kind: 'choice',
    label: 'Link hours to',
    options: [
      { value: 'job', label: 'A job', description: 'Staff pick the job they worked on.' },
      { value: 'customer', label: 'A customer', description: 'Staff pick the customer they visited. No jobs needed.' },
      { value: 'none', label: 'Nothing' },
    ],
  },
  requireJob: {
    kind: 'toggle',
    label: 'A job must be picked',
    description: 'When off, staff can save hours without a job (e.g. travel or yard time).',
    showIf: (s) => s.logAgainst === 'job',
  },
  materials: {
    kind: 'choice',
    label: 'Materials used',
    description: 'Staff can note the materials used on each visit. No prices are recorded.',
    options: [
      { value: 'off', label: 'Not recorded' },
      { value: 'optional', label: 'Staff can add them' },
    ],
  },
  costCodes: {
    kind: 'toggle',
    label: 'Use work categories',
    description: 'Staff pick a category for each block of work, from a list you set up.',
  },
  weekStartsOn: {
    kind: 'choice',
    label: 'Week starts on',
    description: 'This can’t be changed once hours have been recorded.',
    options: WEEK_DAYS.map((d) => ({ value: d, label: d[0].toUpperCase() + d.slice(1) })),
  },
  roundingMinutes: {
    kind: 'choice',
    label: 'Round hours in reports',
    description: 'Each entry is rounded to the nearest step in totals and exports. The exact time is always kept.',
    options: [
      { value: '0', label: 'No rounding' },
      { value: '5', label: '5 min' },
      { value: '6', label: '6 min' },
      { value: '10', label: '10 min' },
      { value: '15', label: '15 min' },
      { value: '30', label: '30 min' },
      { value: '60', label: '1 hour' },
    ],
  },
  overtimeDailyAfterMinutes: {
    kind: 'number',
    label: 'Overtime after this many minutes in a day',
    min: 1,
    max: 1440,
    unit: 'minutes',
    emptyLabel: 'No daily limit',
  },
  overtimeWeeklyAfterMinutes: {
    kind: 'number',
    label: 'Overtime after this many minutes in a week',
    description: 'For example, 39 hours is 2340 minutes.',
    min: 1,
    max: 10080,
    unit: 'minutes',
    emptyLabel: 'No weekly limit',
  },
};
