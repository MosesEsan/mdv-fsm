import { useMemo, useState } from 'react';
import { useSubmitWeek, useWeekEntries, useWeekFor } from '../api/hooks';
import type { TimesheetsSettings } from '../schemas/settings';
import { canEditWeek, canSubmitWeek, type Actor } from '../services/weekRules';
import { roundedTotal } from '../services/rounding';
import { today, weekDays, weekStartFor, type IsoDate } from '@/core/dates';

type Args = { workerId: string | undefined; viewerId: string | undefined; settings: TimesheetsSettings; timezone: string; actor: Actor; initialWeekStart?: IsoDate };

/** A worker's week: days with totals, status, and whether it can be edited or sent in. */
export function useMyWeek({ workerId, viewerId, settings, timezone, actor, initialWeekStart }: Args) {
  const [weekStart, setWeekStart] = useState<IsoDate>(() => initialWeekStart ?? weekStartFor(today(timezone), settings.weekStartsOn));
  const entries = useWeekEntries(workerId, weekStart);
  const week = useWeekFor(workerId, weekStart);
  const submit = useSubmitWeek();

  const days = useMemo(() => {
    const list = entries.data ?? [];
    return weekDays(weekStart).map((date) => ({
      date,
      minutes: list.filter((e) => e.work_date === date).reduce((s, e) => s + e.duration_minutes, 0),
    }));
  }, [entries.data, weekStart]);

  const list = entries.data ?? [];
  const totalMinutes = list.reduce((s, e) => s + e.duration_minutes, 0);
  const status = week.data?.status;
  const isOwnWeek = Boolean(workerId && workerId === viewerId);

  return {
    weekStart,
    setWeekStart,
    days,
    totalMinutes,
    roundedMinutes: roundedTotal(list.map((e) => e.duration_minutes), settings.roundingMinutes),
    week: week.data,
    status,
    rejectReason: status === 'rejected' ? week.data?.reject_reason : null,
    canEdit: canEditWeek(status, actor),
    canSubmit: canSubmitWeek(status, isOwnWeek, list.length > 0),
    submitLabel: settings.approval === 'none' ? 'Send in my hours' : 'Send for sign-off',
    submit: () => week.data && submit.mutate(week.data.id),
    submitting: submit.isPending,
    submitError: submit.error,
    isLoading: entries.isLoading || week.isLoading,
    error: entries.error ?? week.error,
  };
}
