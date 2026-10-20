// Logo upload (web admin). Files go to branding/{tenant}/logo/<random>.<ext>; storage RLS lets only
// platform admins write there. The new path is then saved with platform_set_branding.
import { newId } from '@/core/ids';
import { getSupabase } from '@/core/supabase';
import { BRANDING_BUCKET } from '@/core/branding';

import { LOGO_TYPES, logoPathFor, logoProblem } from './logoRules';

type PickedFile = { type: string; size: number };
type WebInput = { type: string; accept: string; files: ArrayLike<PickedFile> | null; onchange: (() => void) | null; click(): void };
const web = globalThis as unknown as {
  document?: { createElement(tag: 'input'): WebInput };
};

export async function uploadLogo(tenantId: string, file: PickedFile): Promise<string> {
  const problem = logoProblem(file);
  if (problem) throw new Error(problem);
  const path = logoPathFor(tenantId, file.type, newId());
  const { error } = await getSupabase().storage.from(BRANDING_BUCKET).upload(path, file as unknown as Blob, { contentType: file.type, upsert: false });
  if (error) throw new Error('The logo could not be uploaded. Please try again.');
  return path;
}

/** Opens the browser's file picker. Web only (the admin runs in a browser). */
export function pickImageFile(): Promise<PickedFile | null> {
  return new Promise((resolve) => {
    const doc = web.document;
    if (!doc) return resolve(null);
    const input = doc.createElement('input');
    input.type = 'file';
    input.accept = Object.keys(LOGO_TYPES).join(',');
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}
