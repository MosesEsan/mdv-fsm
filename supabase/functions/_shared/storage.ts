// Generated files go in the core private bucket 'exports' under {tenant_id}/{module}/...
// (storage RLS lets owners/managers of that tenant read them while the module is on).
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const EXPORTS_BUCKET = 'exports';

export async function storeFile(admin: SupabaseClient, path: string, bytes: Uint8Array, contentType: string): Promise<boolean> {
  const { error } = await admin.storage.from(EXPORTS_BUCKET).upload(path, bytes, { contentType, upsert: false });
  return !error;
}

export async function removeFile(admin: SupabaseClient, path: string): Promise<void> {
  await admin.storage.from(EXPORTS_BUCKET).remove([path]);
}
