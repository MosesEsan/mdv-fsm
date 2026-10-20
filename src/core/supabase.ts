// Core Supabase client accessor.
// Stage 0 creates the client from build config (clients/<client>/config.ts → app.config.ts)
// and calls setSupabaseClient() once at start-up. If Stage 0 already exports a client,
// replace this file with a re-export of it.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function setSupabaseClient(c: SupabaseClient): void {
  client = c;
}

export function getSupabase(): SupabaseClient {
  if (!client) throw new Error('Supabase client has not been set up');
  return client;
}

/** Throws the Postgres/PostgREST message (our RPCs and triggers raise plain-English messages). */
export function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export type AppSupabaseConfig = { supabaseUrl: string; supabaseAnonKey: string };

export function createAppSupabaseClient(config: AppSupabaseConfig): SupabaseClient {
  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: Platform.OS === 'web' /* invite and password links land on the web build */ },
  });
  const onStateChange = (state: string) => state === 'active' ? supabase.auth.startAutoRefresh() : supabase.auth.stopAutoRefresh();
  AppState.addEventListener('change', onStateChange);
  return supabase;
}
