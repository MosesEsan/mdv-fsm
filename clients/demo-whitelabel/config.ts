// Build-only proof for delivery options B/C. This invented brand is never submitted.
export const config = {
  appName: 'Harbour Field Team',
  slug: 'harbour-field-team',
  scheme: 'harbour-field-team',
  iosBundleId: '<BUNDLE_ID_PREFIX>.harbourfieldteam',
  androidPackage: '<BUNDLE_ID_PREFIX>.harbourfieldteam',
  icon: undefined,
  splashImage: undefined,
  easProjectId: process.env.EAS_PROJECT_ID ?? '<EAS_PROJECT_ID_WHITELABEL>',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  lockedTenantId: '<LOCKED_TENANT_ID>',
};
