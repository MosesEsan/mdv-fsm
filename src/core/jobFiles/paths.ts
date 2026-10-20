// Where job files live in the private 'job-files' bucket. Mirrors the job_files_path_shape check in SQL.
export const JOB_FILES_BUCKET = 'job-files';

const KIND = /^[a-z][a-z0-9_]{0,40}$/;

export function jobFilePaths(tenantId: string, jobId: string, kind: string, fileId: string, ext = 'jpg'): { path: string; thumbPath: string } {
  if (!KIND.test(kind)) throw new Error(`Invalid file kind "${kind}"`);
  const base = `${tenantId}/jobs/${jobId}/${kind}`;
  return { path: `${base}/${fileId}.${ext}`, thumbPath: `${base}/thumbs/${fileId}.${ext}` };
}

/** Longest side for stored photos and thumbnails (keeps uploads small on site connections). */
export const PHOTO_MAX_SIDE = 1600;
export const THUMB_MAX_SIDE = 400;
export const PHOTO_QUALITY = 0.7;

/** Resize target keeping the aspect ratio; never enlarges. */
export function fitWithin(width: number, height: number, maxSide: number): { width: number } | { height: number } | null {
  if (Math.max(width, height) <= maxSide) return null;
  return width >= height ? { width: maxSide } : { height: maxSide };
}
