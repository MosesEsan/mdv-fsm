// Opening stored files. Generated files live in the private 'exports' bucket under
// {tenant_id}/{module}/...; storage RLS decides who can read them.
import { Linking } from 'react-native';
import { getSupabase } from '@/core/supabase';

export const EXPORTS_BUCKET = 'exports';

/** Short-lived download link. Made by the app, so it uses the app's Supabase address. */
export async function signedDownloadUrl(path: string, fileName?: string, bucket = EXPORTS_BUCKET, seconds = 300): Promise<string> {
  const { data, error } = await getSupabase().storage.from(bucket).createSignedUrl(path, seconds, fileName ? { download: fileName } : undefined);
  if (error || !data) throw new Error('The file couldn’t be opened. Please try again.');
  return data.signedUrl;
}

/** Opens a stored file in the phone's browser / viewer (download, share or print from there). */
export async function openStoredFile(path: string, fileName?: string, bucket = EXPORTS_BUCKET): Promise<void> {
  await Linking.openURL(await signedDownloadUrl(path, fileName, bucket));
}
