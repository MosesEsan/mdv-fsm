// Photo upload queue. Photos are saved to the queue first (kept on the phone), then uploaded;
// failed uploads retry with growing waits and whenever the app comes back to the front.
// The queue survives the app closing (AsyncStorage). It is per device.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase } from '@/core/supabase';
import { JOB_FILES_BUCKET, jobFilePaths } from './paths';
import { afterFailure, dueNow, isAlreadyUploaded, type QueuedUpload } from './queueRules';

const KEY = 'job-files-upload-queue:v1';
let items: QueuedUpload[] = [];
let loaded = false;
let running = false;
const listeners = new Set<() => void>();
const doneListeners = new Set<(item: QueuedUpload) => void>();
const uploadHooks = new Map<string, (item: QueuedUpload) => Promise<void>>();

/**
 * Runs after a file of this kind is recorded, inside the same retry (so a failed link is tried
 * again). Modules use it to link the file to their own record without core knowing about them.
 * The hook must be safe to run twice.
 */
export function registerUploadHook(kind: string, hook: (item: QueuedUpload) => Promise<void>): void {
  uploadHooks.set(kind, hook);
}

async function load() {
  if (loaded) return;
  try { items = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '[]'); } catch { items = []; }
  loaded = true;
}
async function persist() {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export const queueSnapshot = () => items;
export function onQueueChange(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
export function onUploaded(l: (item: QueuedUpload) => void) { doneListeners.add(l); return () => { doneListeners.delete(l); }; }

export async function enqueue(newItems: Omit<QueuedUpload, 'attempts' | 'nextTryAt' | 'createdAt'>[]): Promise<void> {
  await load();
  const now = Date.now();
  items = [...items, ...newItems.map((i) => ({ ...i, attempts: 0, nextTryAt: now, createdAt: now }))];
  await persist();
  void processQueue();
}

async function putFile(path: string, uri: string) {
  const body = await (await fetch(uri)).arrayBuffer();
  const { error } = await getSupabase().storage.from(JOB_FILES_BUCKET).upload(path, body, { contentType: 'image/jpeg', upsert: false });
  if (error && !isAlreadyUploaded(error.message)) throw new Error(error.message);
  return body.byteLength;
}

async function uploadOne(item: QueuedUpload) {
  const { path, thumbPath } = jobFilePaths(item.tenantId, item.jobId, item.kind, item.id);
  const size = await putFile(path, item.localUri);
  await putFile(thumbPath, item.thumbUri);
  const { error } = await getSupabase().from('job_files').insert({
    id: item.id, tenant_id: item.tenantId, job_id: item.jobId, kind: item.kind, path, thumb_path: thumbPath,
    content_type: 'image/jpeg', size_bytes: size, width: item.width, height: item.height, caption: item.caption ?? null,
    ...(item.stage ? { stage: item.stage } : {}), ...(item.updateId ? { update_id: item.updateId } : {}),
  });
  if (error && !/duplicate key/i.test(error.message)) throw new Error(error.message);
  const hook = uploadHooks.get(item.kind);
  if (hook) await hook(item);
}

/** Uploads everything that is due. Safe to call often. */
export async function processQueue(): Promise<void> {
  await load();
  if (running) return;
  running = true;
  try {
    for (const item of dueNow(items, Date.now())) {
      try {
        await uploadOne(item);
        items = items.filter((i) => i.id !== item.id);
        doneListeners.forEach((l) => l(item));
      } catch (e) {
        items = items.map((i) => (i.id === item.id ? afterFailure(i, (e as Error).message, Date.now()) : i));
      }
      await persist();
    }
  } finally {
    running = false;
  }
}

/** Retry everything now (e.g. the person tapped "Try again"). */
export async function retryAll(): Promise<void> {
  await load();
  items = items.map((i) => ({ ...i, nextTryAt: 0 }));
  await persist();
  await processQueue();
}
