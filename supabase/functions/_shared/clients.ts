// Supabase clients for Edge Functions.
//   asUser: the caller's token, so RLS and our RPC checks decide what they may do.
//   admin:  service role, for trusted steps only (e.g. uploading to a bucket with no client write policy).
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export function clientsFor(req: Request): { asUser: SupabaseClient; admin: SupabaseClient } | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const url = Deno.env.get('SUPABASE_URL')!;
  const opts = { auth: { persistSession: false, autoRefreshToken: false } };
  return {
    asUser: createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { ...opts, global: { headers: { Authorization: authHeader } } }),
    admin: createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, opts),
  };
}
