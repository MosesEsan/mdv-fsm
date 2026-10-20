// Who can do what to a week. Mirrors the SQL rules, so the UI only offers actions the
// database will accept. The database still enforces them.
import type { TimesheetsSettings } from '../schemas/settings';
import type { WeekStatus } from '../schemas/types';

export type Actor = { isManager: boolean; isOwner: boolean; isSupervisor: boolean };

/** Missing week row = nothing logged yet = draft. */
export function canEditWeek(status: WeekStatus | undefined, actor: Actor): boolean {
  const s = status ?? 'draft';
  if (s === 'draft' || s === 'rejected') return true;
  return s === 'submitted' && actor.isManager;
}

export function canSubmitWeek(status: WeekStatus | undefined, isOwnWeek: boolean, hasEntries: boolean): boolean {
  const s = status ?? 'draft';
  return isOwnWeek && hasEntries && (s === 'draft' || s === 'rejected');
}

/** `isAssigned`: the actor supervises this worker. */
export function canDecideWeek(
  status: WeekStatus,
  settings: Pick<TimesheetsSettings, 'approval'>,
  actor: Actor,
  isOwnWeek: boolean,
  isAssigned: boolean,
): boolean {
  if (status !== 'submitted') return false;
  if (isOwnWeek && !actor.isOwner) return false;
  if (actor.isManager) return true;
  return settings.approval === 'supervisor' && actor.isSupervisor && isAssigned;
}

export function canReopenWeek(status: WeekStatus, actor: Actor): boolean {
  return status === 'approved' && actor.isManager;
}

export const statusLabel: Record<WeekStatus, string> = {
  draft: 'Not sent',
  submitted: 'Waiting for sign-off',
  approved: 'Signed off',
  rejected: 'Sent back',
  exported: 'Exported',
};
