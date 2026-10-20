import { isFeatureEnabled } from '@/core/features';

/** Turns one module on or off, keeping every other flag exactly as stored. */
export function toggleFeature(features: Record<string, unknown> | null | undefined, key: string, on: boolean): Record<string, unknown> {
  const current = { ...(features ?? {}) };
  if (isFeatureEnabled(current, key) === on && key in current) return current;
  current[key] = on;
  return current;
}
