import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { timesheetsSettingsFields, timesheetsSettingsSchema } from '../schemas/settings';

const FULL_DEFAULTS = {
  entryMode: 'start_end',
  breaks: 'off',
  fixedBreakMinutes: 30,
  approval: 'manager',
  logAgainst: 'job',
  requireJob: false,
  costCodes: false,
  weekStartsOn: 'monday',
  roundingMinutes: 15,
  overtimeDailyAfterMinutes: null,
  overtimeWeeklyAfterMinutes: 2340,
};

/** Defaults from the latest migration that defines private.settings_defaults__timesheets(). */
function sqlDefaults(): unknown {
  const dir = join(__dirname, '../../../../supabase/migrations');
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().reverse();
  for (const f of files) {
    const sql = readFileSync(join(dir, f), 'utf8');
    const m = /function private\.settings_defaults__timesheets\(\)[\s\S]*?select '(\{[\s\S]*?\})'::jsonb/.exec(sql);
    if (m) return JSON.parse(m[1]);
  }
  throw new Error('settings_defaults__timesheets not found in migrations');
}

describe('timesheets settings schema', () => {
  it('empty object → full defaults', () => {
    expect(timesheetsSettingsSchema.parse({})).toEqual(FULL_DEFAULTS);
  });

  it('matches the SQL defaults in the migration (client and server agree)', () => {
    expect(timesheetsSettingsSchema.parse({})).toEqual(sqlDefaults());
  });

  it('keeps valid values and fills the rest', () => {
    const s = timesheetsSettingsSchema.parse({ entryMode: 'clock', breaks: 'fixed', fixedBreakMinutes: 45 });
    expect(s).toEqual({ ...FULL_DEFAULTS, entryMode: 'clock', breaks: 'fixed', fixedBreakMinutes: 45 });
  });

  it('falls back to the default for a value this app version does not understand', () => {
    const s = timesheetsSettingsSchema.parse({ entryMode: 'weekly', fixedBreakMinutes: 'thirty', approval: 'supervisor' });
    expect(s.entryMode).toBe('start_end');
    expect(s.fixedBreakMinutes).toBe(30);
    expect(s.approval).toBe('supervisor');
  });

  it('allows clearing overtime limits', () => {
    expect(timesheetsSettingsSchema.parse({ overtimeWeeklyAfterMinutes: null }).overtimeWeeklyAfterMinutes).toBe(null);
  });

  it('has screen metadata for every setting', () => {
    expect(Object.keys(timesheetsSettingsFields).sort()).toEqual(Object.keys(FULL_DEFAULTS).sort());
  });

  it('choice options only use values the schema accepts', () => {
    for (const [key, field] of Object.entries(timesheetsSettingsFields)) {
      if (field.kind !== 'choice') continue;
      for (const option of field.options) {
        const raw = typeof (FULL_DEFAULTS as Record<string, unknown>)[key] === 'number' ? Number(option.value) : option.value;
        expect(timesheetsSettingsSchema.parse({ [key]: raw })[key as keyof typeof FULL_DEFAULTS]).toBe(raw);
      }
    }
  });
});
