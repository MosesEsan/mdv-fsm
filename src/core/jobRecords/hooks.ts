import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthClaims } from '@/core/auth/useAuthClaims';
import { isManagerRole } from '@/core/auth/claims';
import { today } from '@/core/dates';
import { newId } from '@/core/ids';
import { queueJobPhotos, type PhotoStage, type PreparedPhoto } from '@/core/jobFiles';
import { useTenantSettings } from '@/core/settings/useTenantSettings';
import { getSupabase } from '@/core/supabase';
import {
  deleteUpdate, editUpdate, fetchJobList, fetchJobRecord, fetchPeople, fetchUpdates, jobKeys, postUpdate, saveJob, setAssignees, setJobStatus, updateInstructions,
  type SaveJobInput,
} from './api';
import { jobRecordsChannelTopic } from './realtime';
import type { JobFilter, JobStatus } from './rules';

export function useJobContext() {
  const claims = useAuthClaims();
  const tz = useTenantSettings().timezone ?? 'Europe/Dublin';
  return { tz, today: today(tz), userId: claims?.userId, tenantId: claims?.tenantId, isManager: isManagerRole(claims?.role) };
}

export const useJobList = (filter: JobFilter, query: string) =>
  useQuery({ queryKey: jobKeys.list(filter, query.trim()), queryFn: () => fetchJobList(filter, query), placeholderData: (prev) => prev });
export const useJobRecord = (id: string) => useQuery({ queryKey: jobKeys.one(id), queryFn: () => fetchJobRecord(id) });
export const useJobUpdates = (id: string) => useQuery({ queryKey: jobKeys.updates(id), queryFn: () => fetchUpdates(id) });
export const usePeople = () => useQuery({ queryKey: jobKeys.people, queryFn: fetchPeople, staleTime: 5 * 60_000 });

export function useJobMutations() {
  const qc = useQueryClient();
  const { tenantId } = useJobContext();
  const refresh = () => qc.invalidateQueries({ queryKey: jobKeys.all });
  return {
    save: useMutation({
      mutationFn: async (v: { job: SaveJobInput; beforePhotos: PreparedPhoto[] }) => {
        const id = await saveJob(v.job);
        if (v.beforePhotos.length && tenantId) await queueJobPhotos(tenantId, id, v.beforePhotos, { kind: 'photo', stage: 'before' });
        return id;
      },
      onSuccess: refresh,
    }),
    setStatus: useMutation({ mutationFn: (v: { id: string; status: JobStatus }) => setJobStatus(v.id, v.status), onSuccess: refresh }),
    post: useMutation({
      mutationFn: async (v: { jobId: string; body: string; stage: PhotoStage; photos: PreparedPhoto[] }) => {
        if (!tenantId) throw new Error('Please sign in again.');
        const id = newId();
        await postUpdate({ id, tenantId, jobId: v.jobId, body: v.body });
        if (v.photos.length) await queueJobPhotos(tenantId, v.jobId, v.photos, { kind: 'photo', stage: v.stage, updateId: id });
        return id;
      },
      onSuccess: refresh,
    }),
    edit: useMutation({ mutationFn: (v: { id: string; body: string }) => editUpdate(v.id, v.body), onSuccess: refresh }),
    remove: useMutation({ mutationFn: deleteUpdate, onSuccess: refresh }),
    instructions: useMutation({ mutationFn: (v: { id: string; text: string }) => updateInstructions(v.id, v.text), onSuccess: refresh }),
    people: useMutation({
      mutationFn: (v: { jobId: string; add: string[]; remove: string[] }) => {
        if (!tenantId) throw new Error('Please sign in again.');
        return setAssignees(tenantId, v.jobId, v.add, v.remove);
      },
      onSuccess: refresh,
    }),
  };
}

/** Mount on job record screens: any new update, assignment or job change refreshes every open view. */
export function useJobRecordsLive(): void {
  const qc = useQueryClient();
  const { tenantId } = useJobContext();
  useEffect(() => {
    if (!tenantId) return;
    const supabase = getSupabase();
    const refresh = () => {
      void qc.invalidateQueries({ queryKey: jobKeys.all });
      void qc.invalidateQueries({ queryKey: ['job-files'] });
    };
    const channel = supabase
      // Realtime reuses channels by topic. A unique topic prevents overlapping
      // screens and React development remounts from configuring a joined channel.
      .channel(jobRecordsChannelTopic(tenantId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_updates', filter: `tenant_id=eq.${tenantId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_assignees', filter: `tenant_id=eq.${tenantId}` }, refresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_files', filter: `tenant_id=eq.${tenantId}` }, refresh)
      .subscribe();
    const app = AppState.addEventListener('change', (s) => { if (s === 'active') refresh(); });
    return () => { app.remove(); supabase.removeChannel(channel); };
  }, [tenantId, qc]);
}
