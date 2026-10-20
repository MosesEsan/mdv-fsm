import { useQuery } from '@tanstack/react-query';
import type { AppRole } from '@/core/auth/claims';
import { useTenantSettings } from '@/core/settings/useTenantSettings';
import { getSupabase } from '@/core/supabase';
import { roleLabel, type Branding } from './schema';

export const BRANDING_BUCKET = 'branding';

/** Short-lived link to a stored logo (private bucket: members of that business, or the platform team). */
export async function logoUrl(path: string): Promise<string | null> {
  const { data } = await getSupabase().storage.from(BRANDING_BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export const useLogoUrl = (path: string | null | undefined) =>
  useQuery({ queryKey: ['logo', path ?? '-'], queryFn: () => logoUrl(path as string), enabled: Boolean(path), staleTime: 50 * 60_000 });

/** The signed-in person's business: name, colours, logo and job titles. Falls back to neutral defaults. */
export function useBranding() {
  const { data } = useTenantSettings();
  const branding: Branding = data?.branding ?? {};
  const logo = useLogoUrl(branding.logoPath);
  return {
    name: data?.name,
    branding,
    primary: branding.colors?.primary,
    accent: branding.colors?.accent,
    logoUrl: logo.data ?? null,
    roleLabel: (role: AppRole | undefined) => roleLabel(branding, role),
  };
}
