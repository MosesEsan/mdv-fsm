// Mirrors private.feature_enabled() in SQL.
// Accepts {"<module>": true} or {"<module>": {"enabled": true}}.
export function isFeatureEnabled(features: unknown, key: string): boolean {
  if (!features || typeof features !== 'object') return false;
  const value = (features as Record<string, unknown>)[key];
  if (typeof value === 'boolean') return value;
  if (value && typeof value === 'object') return (value as { enabled?: unknown }).enabled === true;
  return false;
}
