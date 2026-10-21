import { useAuthClaims } from '@/core/auth/useAuthClaims';
import { isManagerRole, isViewerRole } from '@/core/auth/claims';
import { localDate, localTime, shiftInstants, today as todayIn } from '@/core/dates';
import { useTimesheetsContext } from '../hooks/useTimesheetsContext';

/** Who's looking and what they may do on the visit screens. The database enforces the same. */
export function useVisitContext() {
  const ctx = useTimesheetsContext();
  const claims = useAuthClaims();
  const tz = ctx.timezone;
  return {
    ...ctx,
    tz,
    today: todayIn(tz),
    /** Owner or manager: sees everyone, can correct anyone's visit. */
    isManager: isManagerRole(claims?.role),
    /** Accounts: sees everything, changes nothing. */
    isViewer: isViewerRole(claims?.role),
    materialsOn: ctx.settings?.materials === 'optional',
    instants: (date: string, s: string, f: string) => shiftInstants(date, s, f, tz),
    dateOf: (iso: string | null) => (iso ? localDate(new Date(iso), tz) : null),
    timeOf: (iso: string | null) => (iso ? localTime(new Date(iso), tz) : ''),
  };
}
