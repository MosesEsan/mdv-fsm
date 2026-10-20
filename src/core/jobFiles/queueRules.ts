// Pure rules for the photo upload queue (unit-tested).
export const PHOTO_STAGES = ['before', 'progress', 'completion'] as const;
export type PhotoStage = (typeof PHOTO_STAGES)[number];

export type QueuedUpload = {
  id: string; tenantId: string; jobId: string; kind: string;
  localUri: string; thumbUri: string; width: number; height: number; caption?: string;
  /** Photo stage on job records: 'before' | 'progress' | 'completion'. */
  stage?: PhotoStage;
  /** The job update this photo belongs to (posted before the photo is queued). */
  updateId?: string;
  /** Extra details for an upload hook (e.g. a module linking the file to its own record). */
  meta?: Record<string, string>;
  attempts: number; nextTryAt: number; lastError?: string; createdAt: number;
};

/** Wait before the next try: 5 s, 30 s, 2 min, then every 10 min. */
export function retryDelayMs(attempts: number): number {
  return [5_000, 30_000, 120_000][attempts - 1] ?? 600_000;
}

export function dueNow(items: QueuedUpload[], now: number): QueuedUpload[] {
  return items.filter((i) => i.nextTryAt <= now).sort((a, b) => a.createdAt - b.createdAt);
}

export function afterFailure(item: QueuedUpload, error: string, now: number): QueuedUpload {
  const attempts = item.attempts + 1;
  return { ...item, attempts, lastError: error, nextTryAt: now + retryDelayMs(attempts) };
}

/** A storage "already exists" error on retry means the earlier try got the file up; carry on. */
export const isAlreadyUploaded = (message: string | undefined) => /already exists|duplicate/i.test(message ?? '');
