export const config = {
  appName: 'Field Service',
  slug: 'field-service',
  scheme: 'field-service',
  iosBundleId: '<BUNDLE_ID_PREFIX>.fieldservice',
  androidPackage: '<BUNDLE_ID_PREFIX>.fieldservice',
  icon: undefined,
  splashImage: undefined,
  easProjectId: process.env.EAS_PROJECT_ID ?? '<EAS_PROJECT_ID_SHARED>',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  lockedTenantId: null as string | null,
};
