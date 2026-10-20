// TanStack Query hooks. Every write invalidates the module's whole cache prefix:
// simple, and correct because one entry change moves day, week and approval totals.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, type IsoDate } from '@/core/dates';
import type { TsEntryPayload } from '../schemas/types';
import * as q from './queries';

const ROOT = 'timesheets' as const;
export const tsKeys = {
  all: [ROOT] as const,
  entries: (workerId: string, from: IsoDate, to: IsoDate) => [ROOT, 'entries', workerId, from, to] as const,
  entry: (id: string) => [ROOT, 'entry', id] as const,
  weekFor: (workerId: string, weekStart: IsoDate) => [ROOT, 'week-for', workerId, weekStart] as const,
  week: (weekId: string) => [ROOT, 'week', weekId] as const,
  summaries: (weekStart: IsoDate) => [ROOT, 'summaries', weekStart] as const,
  events: (weekId: string) => [ROOT, 'events', weekId] as const,
  clock: (workerId: string) => [ROOT, 'clock', workerId] as const,
  jobs: [ROOT, 'jobs'] as const,
  costCodes: [ROOT, 'cost-codes'] as const,
  people: [ROOT, 'people'] as const,
  assigned: (supervisorId: string) => [ROOT, 'assigned', supervisorId] as const,
};

function useInvalidateAll() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: tsKeys.all });
}

// ---- reads ------------------------------------------------------------------

export const useEntries = (workerId: string | undefined, from: IsoDate, to: IsoDate) =>
  useQuery({ queryKey: tsKeys.entries(workerId ?? '-', from, to), queryFn: () => q.fetchEntries(workerId!, from, to), enabled: Boolean(workerId) });

export const useWeekEntries = (workerId: string | undefined, weekStart: IsoDate) =>
  useEntries(workerId, weekStart, addDays(weekStart, 6));

export const useEntry = (id: string | undefined) =>
  useQuery({ queryKey: tsKeys.entry(id ?? '-'), queryFn: () => q.fetchEntry(id!), enabled: Boolean(id) });

export const useWeekFor = (workerId: string | undefined, weekStart: IsoDate) =>
  useQuery({ queryKey: tsKeys.weekFor(workerId ?? '-', weekStart), queryFn: () => q.fetchWeekFor(workerId!, weekStart), enabled: Boolean(workerId) });

export const useWeek = (weekId: string | undefined) =>
  useQuery({ queryKey: tsKeys.week(weekId ?? '-'), queryFn: () => q.fetchWeekById(weekId!), enabled: Boolean(weekId) });

export const useWeekSummaries = (weekStart: IsoDate) =>
  useQuery({ queryKey: tsKeys.summaries(weekStart), queryFn: () => q.fetchWeekSummaries(weekStart) });

export const useWeekEvents = (weekId: string | undefined) =>
  useQuery({ queryKey: tsKeys.events(weekId ?? '-'), queryFn: () => q.fetchWeekEvents(weekId!), enabled: Boolean(weekId) });

export const useClockSession = (workerId: string | undefined, enabled = true) =>
  useQuery({ queryKey: tsKeys.clock(workerId ?? '-'), queryFn: () => q.fetchClockSession(workerId!), enabled: enabled && Boolean(workerId) });

export const useJobOptions = (enabled = true) =>
  useQuery({ queryKey: tsKeys.jobs, queryFn: q.fetchJobOptions, enabled, staleTime: 5 * 60_000 });

export const useCostCodes = (enabled = true) =>
  useQuery({ queryKey: tsKeys.costCodes, queryFn: q.fetchCostCodes, enabled, staleTime: 5 * 60_000 });

export const usePeople = () =>
  useQuery({ queryKey: tsKeys.people, queryFn: q.fetchPeople, staleTime: 5 * 60_000 });

export const useAssignedWorkerIds = (supervisorId: string | undefined, enabled = true) =>
  useQuery({ queryKey: tsKeys.assigned(supervisorId ?? '-'), queryFn: () => q.fetchMyAssignedWorkerIds(supervisorId!), enabled: enabled && Boolean(supervisorId) });

// ---- writes -----------------------------------------------------------------

export function useSaveEntry() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: TsEntryPayload }) =>
      id ? q.updateEntry(id, payload) : q.insertEntry(payload),
    onSettled: invalidate,
  });
}

export function useSaveEntries() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (payloads: TsEntryPayload[]) => {
      for (const p of payloads) await q.insertEntry(p); // sequential: the first error stops the rest
    },
    onSettled: invalidate,
  });
}

export function useDeleteEntry() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: q.deleteEntry, onSettled: invalidate });
}

export function useSubmitWeek() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: q.submitWeek, onSettled: invalidate });
}

export function useDecideWeek() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (v: { weekId: string; decision: 'approve' | 'reject'; reason?: string }) => q.decideWeek(v.weekId, v.decision, v.reason),
    onSettled: invalidate,
  });
}

/** Approves several submitted weeks; reports how many went through. */
export function useBulkApprove() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (weekIds: string[]) => {
      const results = await Promise.allSettled(weekIds.map((id) => q.decideWeek(id, 'approve')));
      return { approved: results.filter((r) => r.status === 'fulfilled').length, failed: results.filter((r) => r.status === 'rejected').length };
    },
    onSettled: invalidate,
  });
}

export function useReopenWeek() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (v: { weekId: string; reason: string }) => q.reopenWeek(v.weekId, v.reason), onSettled: invalidate });
}

export function useClockIn() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: q.clockIn, onSettled: invalidate });
}

export function useClockOut() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: q.clockOut, onSettled: invalidate });
}

export function useClockCancel() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: q.clockCancel, onSettled: invalidate });
}
