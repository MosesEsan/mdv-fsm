// Shared helpers for the demo seed scripts. Local/dev only; never point these at production.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const password = process.env.SEED_PASSWORD;

export const TENANTS = {
  flooring: '00000000-0000-0000-0000-000000000001',
  construction: '00000000-0000-0000-0000-000000000002',
  property: '00000000-0000-0000-0000-000000000003',
  mdc: '00000000-0000-0000-0000-000000000004',
};

export type SeedRole = 'owner' | 'manager' | 'supervisor' | 'worker' | 'fitter' | 'viewer';
export type SeedUser = { key: string; tenant: string; role: SeedRole; email: string; name: string };
export type Ids = Record<string, string>;

export function adminClient(): SupabaseClient {
  if (!key || !password) throw new Error('Set SUPABASE_SERVICE_ROLE_KEY and SEED_PASSWORD first (see .env.example).');
  if (/pokflcodhocxkwcjriit|prod/i.test(url) && !process.env.SEED_ALLOW_HOSTED_DEV) {
    throw new Error(`Refusing to seed ${url}. Seeds are for local use; set SEED_ALLOW_HOSTED_DEV=1 only for the hosted dev project.`);
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function findOrCreate(supabase: SupabaseClient, email: string): Promise<string> {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = data.users.find((u) => u.email === email);
    if (found) return found.id;
    if (data.users.length < 100) break;
  }
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  return data.user.id;
}

/** Logins plus profiles. Returns user ids by seed key. */
export async function seedUsers(supabase: SupabaseClient, users: SeedUser[]): Promise<Ids> {
  const ids: Ids = {};
  for (const u of users) {
    ids[u.key] = await findOrCreate(supabase, u.email);
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: ids[u.key], tenant_id: u.tenant, full_name: u.name, role: u.role, active: true }, { onConflict: 'id' });
    if (error) throw error;
  }
  return ids;
}

export function printLogins(title: string, users: SeedUser[]) {
  console.log(title);
  for (const u of users) console.log(`  ${u.email.padEnd(30)} ${u.role}`);
}
