import { z } from 'zod';
import {
  getSettingsDefinitions,
  registryVersion,
  type ModuleSettingsMap,
  type SettingsNamespace,
} from './registry';

/** All registered module settings, with defaults applied. */
export type TenantSettings = { [N in SettingsNamespace]: ModuleSettingsMap[N] };

let cached: { version: number; schema: z.ZodType<Record<string, unknown>> } | null = null;

/**
 * Combined schema built from the registry. Each namespace:
 *  - missing        → all of that module's defaults (prefault parses {} through the module schema)
 *  - not an object  → all defaults (junk never breaks the app)
 * Unknown namespaces (e.g. a module not installed in this build) are dropped.
 */
export function buildTenantSettingsSchema(): z.ZodType<Record<string, unknown>> {
  if (cached && cached.version === registryVersion()) return cached.schema;
  const shape: Record<string, z.ZodType> = {};
  for (const def of getSettingsDefinitions()) {
    shape[def.namespace] = def.schema.prefault({}).catch(() => def.schema.parse({}));
  }
  const schema = z.object(shape) as unknown as z.ZodType<Record<string, unknown>>;
  cached = { version: registryVersion(), schema };
  return schema;
}

export function parseTenantSettings(raw: unknown): TenantSettings {
  const input = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return buildTenantSettingsSchema().parse(input) as TenantSettings;
}
