import '@/core/register'; // core features with menus (e.g. scheduling)
import '@/modules'; // registers modules (menus + settings) before anything renders
import React from 'react';
import { AppState, Button, Text, View } from 'react-native';
import { Redirect, Stack, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { createAppSupabaseClient, setSupabaseClient } from '@/core/supabase';
import { AuthProvider, useSession } from '@/core/auth/AuthProvider';
import { useTenantSettingsSync } from '@/core/settings/useTenantSettingsSync';
import { BrandTheme } from '@/core/branding';
import { useUploadQueueRunner } from '@/core/jobFiles';

const extra = Constants.expoConfig?.extra ?? {};
setSupabaseClient(createAppSupabaseClient({
  supabaseUrl: extra.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: extra.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
}));
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 }, mutations: { retry: 0 } } });
AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'));

function SettingsSync() {
  useTenantSettingsSync();
  return null;
}

function UploadQueue() {
  const { session } = useSession();
  return session ? <UploadQueueRunner /> : null;
}

function UploadQueueRunner() {
  useUploadQueueRunner();
  return null;
}

function Message({ text, onSignOut }: { text: string; onSignOut: () => void }) {
  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text>{text}</Text>
      <Button title="Sign out" onPress={onSignOut} />
    </View>
  );
}

/** Sends each person to the right area: login, the app (business users) or /admin (platform team). */
function Guard() {
  const { session, claims, isPlatformAdmin, isLoading, authError, signOut } = useSession();
  const segments = useSegments() as string[];
  if (isLoading) return null;
  const area = segments[0];
  const page = segments[1];
  const stack = <Stack screenOptions={{ headerShown: false }} />;

  if (authError) return <Message text={authError} onSignOut={signOut} />;
  if (!session) return area === '(auth)' ? stack : <Redirect href="/(auth)/login" />;
  if (area === '(auth)' && page === 'set-password') return stack; // invite links land here signed in
  if (area === 'admin') return isPlatformAdmin ? stack : <Redirect href="/" />;
  if (!claims) {
    return isPlatformAdmin
      ? <Redirect href="/admin" />
      : <Message text="Your account isn't set up yet. Ask the owner." onSignOut={signOut} />;
  }
  if (area === '(auth)') return <Redirect href="/(app)" />;
  return stack;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsSync />
        <UploadQueue />
        <BrandTheme>
          <Guard />
        </BrandTheme>
      </AuthProvider>
    </QueryClientProvider>
  );
}
