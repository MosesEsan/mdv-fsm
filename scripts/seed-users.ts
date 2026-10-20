// Seeds demo logins for local testing. Safe to run more than once.
// Needs: EXPO_PUBLIC_SUPABASE_URL (defaults to local), SUPABASE_SERVICE_ROLE_KEY, SEED_PASSWORD.
// Run supabase/seed.sql first (supabase db reset does that) so the tenants exist.
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.SEED_PASSWORD;

const TENANTS = { flooring: '00000000-0000-0000-0000-000000000001', construction: '00000000-0000-0000-0000-000000000002' };

type SeedUser = { key: string; tenant: string; role: 'owner' | 'manager' | 'supervisor' | 'worker' | 'fitter'; email: string; name: string };

const USERS: SeedUser[] = [
  { key: 'c-owner', tenant: TENANTS.construction, role: 'owner', email: 'owner@construction.test', name: 'Construction Owner' },
  { key: 'c-manager', tenant: TENANTS.construction, role: 'manager', email: 'manager@construction.test', name: 'Construction Manager' },
  { key: 'c-supervisor', tenant: TENANTS.construction, role: 'supervisor', email: 'supervisor@construction.test', name: 'Construction Supervisor' },
  { key: 'c-worker1', tenant: TENANTS.construction, role: 'worker', email: 'worker1@construction.test', name: 'Construction Worker 1' },
  { key: 'c-worker2', tenant: TENANTS.construction, role: 'worker', email: 'worker2@construction.test', name: 'Construction Worker 2' },
  { key: 'f-owner', tenant: TENANTS.flooring, role: 'owner', email: 'owner@flooring.test', name: 'Flooring Owner' },
  { key: 'f-fitter', tenant: TENANTS.flooring, role: 'fitter', email: 'fitter@flooring.test', name: 'Flooring Fitter' },
];

async function main() {
  if (!key || !password) throw new Error('Set SUPABASE_SERVICE_ROLE_KEY and SEED_PASSWORD first (see .env.example).');
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  async function findOrCreate(email: string): Promise<string> {
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

  const ids: Record<string, string> = {};
  for (const u of USERS) {
    ids[u.key] = await findOrCreate(u.email);
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: ids[u.key], tenant_id: u.tenant, full_name: u.name, role: u.role, active: true }, { onConflict: 'id' });
    if (error) throw error;
  }

  const { error: assignError } = await supabase
    .from('ts_assignments')
    .upsert(
      { tenant_id: TENANTS.construction, supervisor_id: ids['c-supervisor'], worker_id: ids['c-worker1'] },
      { onConflict: 'tenant_id,worker_id' },
    );
  if (assignError) throw assignError;

  // Platform team login: belongs to no business, opens /admin (web).
  const adminId = await findOrCreate('admin@platform.test');
  const { error: adminError } = await supabase.from('platform_admins').upsert({ user_id: adminId, note: 'local seed' }, { onConflict: 'user_id' });
  if (adminError) throw adminError;

  console.log('Seed logins (password = SEED_PASSWORD):');
  console.log(`  ${'admin@platform.test'.padEnd(30)} platform admin (web: /admin)`);
  for (const u of USERS) console.log(`  ${u.email.padEnd(30)} ${u.role}`);
  console.log('  supervisor@construction.test signs off worker1 only.');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
