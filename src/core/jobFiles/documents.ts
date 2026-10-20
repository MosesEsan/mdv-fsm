// Documents for a job (e.g. a quote PDF), uploaded straight away rather than queued:
// the person is waiting to share it. owner_only documents are visible to the owner alone.
import { newId } from '@/core/ids';
import { openStoredFile } from '@/core/files/storage';
import { getSupabase } from '@/core/supabase';
import { JOB_FILES_BUCKET, jobFilePaths } from './paths';

export type JobDocument = {
  tenantId: string; jobId: string; kind: string; uri: string;
  contentType: 'application/pdf' | 'image/jpeg' | 'image/png'; ownerOnly?: boolean; caption?: string;
};

const EXT: Record<JobDocument['contentType'], string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' };

/** Uploads the file and records it on the job. Returns the job_files id. */
export async function uploadJobDocument(d: JobDocument): Promise<string> {
  const id = newId();
  const { path } = jobFilePaths(d.tenantId, d.jobId, d.kind, id, EXT[d.contentType]);
  const body = await (await fetch(d.uri)).arrayBuffer();
  const storage = getSupabase().storage.from(JOB_FILES_BUCKET);
  const up = await storage.upload(path, body, { contentType: d.contentType, upsert: false });
  if (up.error) throw new Error('The file couldn’t be saved. Please try again.');
  const { error } = await getSupabase().from('job_files').insert({
    id, tenant_id: d.tenantId, job_id: d.jobId, kind: d.kind, path, content_type: d.contentType,
    size_bytes: body.byteLength, owner_only: d.ownerOnly ?? false, caption: d.caption ?? null,
  });
  if (error) {
    await storage.remove([path]); // don't leave a file nobody can see
    throw new Error('The file couldn’t be saved. Please try again.');
  }
  return id;
}

/** Opens a job file in the device's viewer by its id (RLS decides whether this person may). */
export async function openJobFile(fileId: string, fileName?: string): Promise<void> {
  const { data, error } = await getSupabase().from('job_files').select('path').eq('id', fileId).maybeSingle();
  if (error || !data) throw new Error('The file couldn’t be found.');
  await openStoredFile((data as { path: string }).path, fileName, JOB_FILES_BUCKET);
}
