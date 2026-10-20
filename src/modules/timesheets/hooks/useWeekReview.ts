import { useMemo } from 'react';
import { useAssignedWorkerIds, useDecideWeek, useEntries, usePeople, useReopenWeek, useWeek, useWeekEvents } from '../api/hooks';
import type { TsEvent } from '../schemas/types';
import { canDecideWeek, canReopenWeek } from '../services/weekRules';
import { addDays, weekDays } from '@/core/dates';
import type { ReadyTimesheetsContext } from './useTimesheetsContext';

const eventLabel: Record<TsEvent['action'], string> = {
  submitted: 'Sent in',
  approved: 'Signed off',
  rejected: 'Sent back',
  reopened: 'Reopened',
  entry_added: 'Hours added after sending in',
  entry_changed: 'Hours changed after sending in',
  entry_deleted: 'Hours removed after sending in',
  exported: 'Exported',
};

/** One worker's week for an approver: entries by day, history, and the allowed actions. */
export function useWeekReview(ctx: ReadyTimesheetsContext, weekId: string) {
  const week = useWeek(weekId);
  const w = week.data;
  const entries = useEntries(w?.worker_id, w?.week_start ?? '1970-01-01', w ? addDays(w.week_start, 6) : '1970-01-01');
  const events = useWeekEvents(weekId);
  const people = usePeople();
  const assigned = useAssignedWorkerIds(ctx.userId, ctx.actor.isSupervisor);
  const decide = useDecideWeek();
  const reopen = useReopenWeek();

  const name = (id: string | null) => (id ? people.data?.find((p) => p.id === id)?.label ?? 'Someone' : 'Automatic');

  const days = useMemo(() => {
    if (!w) return [];
    const list = entries.data ?? [];
    return weekDays(w.week_start).map((date) => {
      const dayEntries = list.filter((e) => e.work_date === date);
      return { date, entries: dayEntries, minutes: dayEntries.reduce((s, e) => s + e.duration_minutes, 0) };
    });
  }, [w, entries.data]);

  const isAssigned = Boolean(w && (assigned.data ?? []).includes(w.worker_id));
  const isOwn = w?.worker_id === ctx.userId;

  return {
    week: w,
    workerName: w ? name(w.worker_id) : '',
    days,
    totalMinutes: days.reduce((s, d) => s + d.minutes, 0),
    history: (events.data ?? []).map((e) => ({ id: e.id, when: e.created_at, label: eventLabel[e.action], by: name(e.actor_id), reason: typeof e.detail.reason === 'string' ? e.detail.reason : undefined })),
    canDecide: Boolean(w && canDecideWeek(w.status, ctx.settings, ctx.actor, isOwn, isAssigned)),
    canReopen: Boolean(w && canReopenWeek(w.status, ctx.actor)),
    approve: () => decide.mutate({ weekId, decision: 'approve' }),
    reject: (reason: string) => decide.mutate({ weekId, decision: 'reject', reason }),
    reopen: (reason: string) => reopen.mutate({ weekId, reason }),
    busy: decide.isPending || reopen.isPending,
    actionError: decide.error ?? reopen.error,
    isLoading: week.isLoading || entries.isLoading,
    error: week.error ?? entries.error,
  };
}
