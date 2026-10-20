// Core settings tests use a made-up module, so core never depends on a real one.
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { getSettingsDefinitions, registerModuleSettings, type SettingsNamespace } from '../registry';
import { parseTenantSettings } from '../schema';

const demoSchema = z.object({
  mode: z.enum(['a', 'b']).default('a').catch('a'),
  limit: z.number().int().min(1).max(10).default(5).catch(5),
  enabled: z.boolean().default(false).catch(false),
});
const demoDefaults = { mode: 'a', limit: 5, enabled: false };

registerModuleSettings({
  namespace: 'demo' as SettingsNamespace,
  feature: 'demo',
  title: 'Demo',
  schema: demoSchema as never,
  fields: {
    mode: { kind: 'choice', label: 'Mode', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] },
    limit: { kind: 'number', label: 'Limit', min: 1, max: 10 },
    enabled: { kind: 'toggle', label: 'Enabled' },
  } as never,
});

describe('TenantSettings schema', () => {
  it('registers module namespaces', () => {
    expect(getSettingsDefinitions().map((d) => d.namespace)).toContain('demo');
  });

  it('empty object → full defaults for every module', () => {
    expect(parseTenantSettings({})).toEqual({ demo: demoDefaults });
  });

  it('null / non-object → full defaults', () => {
    expect(parseTenantSettings(null)).toEqual({ demo: demoDefaults });
    expect(parseTenantSettings('junk')).toEqual({ demo: demoDefaults });
    expect(parseTenantSettings([])).toEqual({ demo: demoDefaults });
  });

  it('a junk namespace value falls back to that module’s defaults', () => {
    expect(parseTenantSettings({ demo: 'broken' })).toEqual({ demo: demoDefaults });
  });

  it('partial namespace keeps saved values; bad values fall back per field', () => {
    expect(parseTenantSettings({ demo: { mode: 'b', limit: 99 } })).toEqual({ demo: { ...demoDefaults, mode: 'b' } });
  });

  it('drops namespaces for modules not in this build', () => {
    expect(parseTenantSettings({ payroll: { x: 1 } })).toEqual({ demo: demoDefaults });
  });
});
