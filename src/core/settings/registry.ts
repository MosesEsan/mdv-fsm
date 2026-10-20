// Module settings registry. Core knows nothing about specific modules:
// each module registers its own schema + field metadata, and augments ModuleSettingsMap:
//
//   declare module '@/core/settings/registry' {
//     interface ModuleSettingsMap { timesheets: TimesheetsSettings }
//   }
//
// The matching server-side validator is private.settings_validate__<namespace>() in SQL.
import type { z } from 'zod';
import type { SettingsFields } from './fields';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ModuleSettingsMap {}

export type SettingsNamespace = keyof ModuleSettingsMap & string;

export type ModuleSettingsDefinition<N extends string = string, T = Record<string, unknown>> = {
  namespace: N;
  /** Key in tenants.features that switches the module on. */
  feature: string;
  title: string;
  description?: string;
  /** Every field must have .default() (and .catch()) so {} parses to full defaults. */
  schema: z.ZodType<T>;
  fields: SettingsFields<T>;
};

const definitions = new Map<string, ModuleSettingsDefinition<string, any>>();
let version = 0;

export function registerModuleSettings<N extends SettingsNamespace>(
  def: ModuleSettingsDefinition<N, ModuleSettingsMap[N]>,
): void {
  if (!/^[a-z][a-z0-9_]{0,40}$/.test(def.namespace)) {
    throw new Error(`Invalid settings namespace "${def.namespace}"`);
  }
  if (definitions.has(def.namespace)) return; // idempotent (fast refresh, repeated imports)
  definitions.set(def.namespace, def);
  version++;
}

export function getSettingsDefinitions(): ModuleSettingsDefinition<string, any>[] {
  return [...definitions.values()];
}

export function getSettingsDefinition<N extends SettingsNamespace>(
  namespace: N,
): ModuleSettingsDefinition<N, ModuleSettingsMap[N]> {
  const def = definitions.get(namespace);
  if (!def) throw new Error(`No settings registered for "${namespace}"`);
  return def as ModuleSettingsDefinition<N, ModuleSettingsMap[N]>;
}

export function registryVersion(): number {
  return version;
}

/** Tests only. */
export function _resetSettingsRegistry(): void {
  definitions.clear();
  version++;
}
