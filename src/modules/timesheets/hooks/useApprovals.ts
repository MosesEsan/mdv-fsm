import { useMemo, useState } from 'react';
import { useAssignedWorkerIds, useBulkApprove, usePeople, useWeekSummaries } from '../api/hooks';
import type { ReadyTimesheetsContext } from './useTimesheetsContext';
import { canDecideWeek } from '../services/weekRules';
import { today, weekStartFor, type IsoDate } from '@/core/dates';

/** Weeks the viewer can see for one calendar week (RLS limits supervisors to their people). */
export function useApprovals(ctx: ReadyTimesheetsContext) {
  const [weekStart, setWeekStart] = useState<IsoDate>(() => weekStartFor(today(ctx.timezone), ctx.settings.weekStartsOn));
  const summaries = useWeekSummaries(weekStart);
  const people = usePeople();
  const assigned = useAssignedWorkerIds(ctx.userId, ctx.actor.isSupervisor);
  const bulk = useBulkApprove();

  const rows = useMemo(() => {
    const name = (id: string) => people.data?.find((p) => p.id === id)?.label ?? 'Unknown';
    const assignedIds = new Set(assigned.data ?? []);
    return (summaries.data ?? [])
      .map((s) => ({
        ...s,
        name: name(s.worker_id),
        hasOvertime: s.overtime_minutes > 0,
        canDecide: canDecideWeek(s.status, ctx.settings, ctx.actor, s.worker_id === ctx.userId, assignedIds.has(s.worker_id)),
      }))
      .sort((a, b) => Number(b.status === 'submitted') - Number(a.status === 'submitted') || a.name.localeCompare(b.name));
  }, [summaries.data, people.data, assigned.data, ctx]);

  const decidable = rows.filter((r) => r.canDecide);

  return {
    weekStart,
    setWeekStart,
    rows,
    waitingCount: decidable.length,
    approveAll: () => bulk.mutate(decidable.map((r) => r.week_id)),
    approvingAll: bulk.isPending,
    bulkResult: bulk.data,
    bulkError: bulk.error,
    isLoading: summaries.isLoading || people.isLoading,
    error: summaries.error ?? people.error,
  };
}
