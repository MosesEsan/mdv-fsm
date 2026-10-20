import { useAuthClaims } from '@/core/auth/useAuthClaims';
import { isManagerRole, isOwnerRole, isSupervisorRole } from '@/core/auth/claims';
import { useModuleSettings } from '@/core/settings/useModuleSettings';
import type { TimesheetsSettings } from '../schemas/settings';
import type { Actor } from '../services/weekRules';

/** Who's using the module, and how the tenant has set it up. */
export function useTimesheetsContext() {
  const claims = useAuthClaims();
  const { settings, timezone, enabled, isLoading, error } = useModuleSettings('timesheets');
  const actor: Actor = {
    isOwner: isOwnerRole(claims?.role),
    isManager: isManagerRole(claims?.role),
    isSupervisor: isSupervisorRole(claims?.role),
  };
  return {
    ready: Boolean(claims && settings && timezone),
    userId: claims?.userId,
    tenantId: claims?.tenantId,
    actor,
    settings,
    timezone: timezone ?? 'Europe/Dublin',
    enabled,
    isLoading: isLoading || !claims,
    error,
  };
}

export type TimesheetsContext = ReturnType<typeof useTimesheetsContext>;

export type ReadyTimesheetsContext = {
  userId: string;
  tenantId: string;
  actor: Actor;
  settings: TimesheetsSettings;
  timezone: string;
};

/** Narrows the context once claims and settings have loaded; null until then. */
export function readyContext(ctx: TimesheetsContext): ReadyTimesheetsContext | null {
  if (!ctx.userId || !ctx.tenantId || !ctx.settings) return null;
  return { userId: ctx.userId, tenantId: ctx.tenantId, actor: ctx.actor, settings: ctx.settings, timezone: ctx.timezone };
}
