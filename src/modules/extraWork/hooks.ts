import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthClaims } from '@/core/auth/useAuthClaims';
import { newId } from '@/core/ids';
import { queueJobPhotos, type PreparedPhoto } from '@/core/jobFiles';
import { jobKeys } from '@/core/jobRecords';
import { useTenantSettings } from '@/core/settings/useTenantSettings';
import { getSupabase } from '@/core/supabase';
import { EXTRA_WORK, addEntry, deleteEntry, fetchEntries, fetchEntry, fetchJobEntries, fetchOpenCounts, setInvoiced, xwKeys } from './api';
import { extraValues, type ExtraForm } from './rules';

export const useExtraEntries = (scope: 'open' | 'all') => useQuery({ queryKey: xwKeys.list(scope), queryFn: () => fetchEntries(scope) });
export const useJobExtraEntries = (jobId: string) => useQuery({ queryKey: xwKeys.job(jobId), queryFn: () => fetchJobEntries(jobId) });
export const useExtraEntry = (id: string) => useQuery({ queryKey: xwKeys.one(id), queryFn: () => fetchEntry(id) });

/** Open counts per job, for the jobs list. Only fetched when the module is on. */
export function useOpenCounts() {
  const { isFeatureEnabled } = useTenantSettings();
  return useQuery({ queryKey: xwKeys.counts, queryFn: fetchOpenCounts, enabled: isFeatureEnabled(EXTRA_WORK), staleTime: 60_000 });
}

export function useExtraMutations() {
  const qc = useQueryClient();
  const tenantId = useAuthClaims()?.tenantId;
  const refresh = () => { void qc.invalidateQueries({ queryKey: xwKeys.all }); void qc.invalidateQueries({ queryKey: jobKeys.all }); };
  return {
    add: useMutation({
      mutationFn: async (v: { jobId: string; form: ExtraForm; photos: PreparedPhoto[] }) => {
        if (!tenantId) throw new Error('Please sign in again.');
        const id = newId();
        await addEntry({ id, tenantId, jobId: v.jobId, ...extraValues(v.form) });
        // The upload hook links each photo to this entry once it's up.
        if (v.photos.length) await queueJobPhotos(tenantId, v.jobId, v.photos, { kind: EXTRA_WORK, stage: 'progress', meta: { entryId: id } });
        return id;
      },
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: deleteEntry, onSuccess: refresh }),
    invoiced: useMutation({ mutationFn: (v: { id: string; invoiced: boolean }) => setInvoiced(v.id, v.invoiced), onSuccess: refresh }),
  };
}

/** Keeps the office's list current when someone on site logs extra work. */
export function useExtraWorkLive(): void {
  const qc = useQueryClient();
  const tenantId = useAuthClaims()?.tenantId;
  useEffect(() => {
    if (!tenantId) return;
    const supabase = getSupabase();
    const channel = supabase
      .channel(`extra-work:${tenantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'xw_entries', filter: `tenant_id=eq.${tenantId}` },
        () => void qc.invalidateQueries({ queryKey: xwKeys.all }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tenantId, qc]);
}
