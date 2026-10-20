export const config = {
  appName: 'Field Service', slug: 'field-service', iosBundleId: 'com.example.fieldservice', androidPackage: 'com.example.fieldservice',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '', supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '', lockedTenantId: null as string | null,
};
