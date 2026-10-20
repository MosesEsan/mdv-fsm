import { useEffect, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthClaims } from '@/core/auth/useAuthClaims';
import { newId } from '@/core/ids';
import { getSupabase } from '@/core/supabase';
import { takePhotos } from './devicePhotos';
import { JOB_FILES_BUCKET } from './paths';
import { enqueue, onQueueChange, onUploaded, processQueue, queueSnapshot, retryAll } from './uploadQueue';

export type JobFile = {
  id: string; kind: string; path: string; thumbPath: string | null; caption: string | null; createdAt: string;
  url: string | null; thumbUrl: string | null;
};

export const jobFilesKey = (jobId: string, kind?: string) => ['job-files', jobId, kind ?? 'all'] as const;

async function fetchJobFiles(jobId: string, kind?: string): Promise<JobFile[]> {
  let q = getSupabase().from('job_files').select('id, kind, path, thumb_path, caption, created_at').eq('job_id', jobId).order('created_at');
  if (kind) q = q.eq('kind', kind);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as { id: string; kind: string; path: string; thumb_path: string | null; caption: string | null; created_at: string }[];
  const paths = rows.flatMap((r) => [r.path, ...(r.thumb_path ? [r.thumb_path] : [])]);
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data: urls } = await getSupabase().storage.from(JOB_FILES_BUCKET).createSignedUrls(paths, 3600);
    for (const u of urls ?? []) if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl);
  }
  return rows.map((r) => ({
    id: r.id, kind: r.kind, path: r.path, thumbPath: r.thumb_path, caption: r.caption, createdAt: r.created_at,
    url: signed.get(r.path) ?? null, thumbUrl: (r.thumb_path && signed.get(r.thumb_path)) || signed.get(r.path) || null,
  }));
}

export const useJobFiles = (jobId: string, kind?: string) =>
  useQuery({ queryKey: jobFilesKey(jobId, kind), queryFn: () => fetchJobFiles(jobId, kind), staleTime: 30 * 60_000 });

/** Mount once near the app root: retries waiting uploads at start and whenever the app returns to the front. */
export function useUploadQueueRunner(): void {
  const qc = useQueryClient();
  useEffect(() => {
    void processQueue();
    const app = AppState.addEventListener('change', (s) => { if (s === 'active') void processQueue(); });
    const timer = setInterval(() => void processQueue(), 60_000);
    const off = onUploaded((item) => qc.invalidateQueries({ queryKey: ['job-files', item.jobId] }));
    return () => { app.remove(); clearInterval(timer); off(); };
  }, [qc]);
}

/** Photos still waiting to upload for a job (shown with a "waiting for signal" note). */
export function usePendingUploads(jobId: string) {
  const all = useSyncExternalStore(onQueueChange, queueSnapshot, queueSnapshot);
  return { pending: all.filter((i) => i.jobId === jobId), retry: retryAll };
}

/** Take or choose photos for a job; they go into the upload queue straight away. */
export function useAddPhotos(jobId: string, kind: string) {
  const claims = useAuthClaims();
  const [error, setError] = useState<string | null>(null);
  const add = useMutation({
    mutationFn: async (source: 'camera' | 'library') => {
      setError(null);
      if (!claims?.tenantId) throw new Error('Please sign in again.');
      const photos = await takePhotos(source);
      await enqueue(photos.map((p) => ({
        id: newId(), tenantId: claims.tenantId, jobId, kind,
        localUri: p.uri, thumbUri: p.thumbUri, width: p.width, height: p.height,
      })));
      return photos.length;
    },
    onError: (e) => setError((e as Error).message),
  });
  return { add: add.mutate, busy: add.isPending, error };
}
