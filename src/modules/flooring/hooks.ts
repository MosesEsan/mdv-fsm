import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthClaims } from '@/core/auth/useAuthClaims';
import { deleteRoom, fetchViewing, fetchViewingJobs, flooringKeys, saveRoom, saveViewing } from './api';
import type { RoomValues } from './rules';

export const useViewing = (jobId: string) => useQuery({ queryKey: flooringKeys.viewing(jobId), queryFn: () => fetchViewing(jobId) });
export const useViewingJobs = () => useQuery({ queryKey: flooringKeys.jobs, queryFn: fetchViewingJobs });

export function useViewingMutations(jobId: string) {
  const qc = useQueryClient();
  const tenantId = useAuthClaims()?.tenantId as string;
  const refresh = () => qc.invalidateQueries({ queryKey: flooringKeys.all });

  const ensureViewing = async (current: string | null | undefined) =>
    current ?? saveViewing(tenantId, jobId, { viewed_at: null, notes: null, est_duration_hours: null });

  return {
    saveDetails: useMutation({
      mutationFn: (v: { viewed_at: string | null; notes: string | null; est_duration_hours: number | null }) => saveViewing(tenantId, jobId, v),
      onSuccess: refresh,
    }),
    saveRoom: useMutation({
      mutationFn: async (v: { viewingId?: string | null; room: RoomValues & { id?: string; sort_order: number } }) =>
        saveRoom(tenantId, await ensureViewing(v.viewingId), v.room),
      onSuccess: refresh,
    }),
    deleteRoom: useMutation({ mutationFn: deleteRoom, onSuccess: refresh }),
  };
}
