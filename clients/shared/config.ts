export const config = {
  appName: 'Jobsite',
  slug: 'field-service',
  scheme: 'field-service',
  iosBundleId: 'ie.mesandigital.fsm',
  androidPackage: 'ie.mesandigital.fsm',
  icon: undefined,
  splashImage: undefined,
  easProjectId: process.env.EAS_PROJECT_ID ?? 'ca8fe224-55dc-4eab-bd6a-5cd3b38a0b5d',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  lockedTenantId: null as string | null,
};
