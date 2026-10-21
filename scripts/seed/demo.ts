// Demo Flooring, Demo Construction and the platform team login. SQL: supabase/seeds/00_demo-flooring-construction.sql
import type { SupabaseClient } from '@supabase/supabase-js';
import { TENANTS, findOrCreate, printLogins, seedUsers, type SeedUser } from './shared';

const USERS: SeedUser[] = [
  { key: 'c-owner', tenant: TENANTS.construction, role: 'owner', email: 'owner@construction.test', name: 'Construction Owner' },
  { key: 'c-manager', tenant: TENANTS.construction, role: 'manager', email: 'manager@construction.test', name: 'Construction Manager' },
  { key: 'c-supervisor', tenant: TENANTS.construction, role: 'supervisor', email: 'supervisor@construction.test', name: 'Construction Supervisor' },
  { key: 'c-worker1', tenant: TENANTS.construction, role: 'worker', email: 'worker1@construction.test', name: 'Construction Worker 1' },
  { key: 'c-worker2', tenant: TENANTS.construction, role: 'worker', email: 'worker2@construction.test', name: 'Construction Worker 2' },
  { key: 'f-owner', tenant: TENANTS.flooring, role: 'owner', email: 'owner@flooring.test', name: 'Flooring Owner' },
  { key: 'f-fitter', tenant: TENANTS.flooring, role: 'fitter', email: 'fitter@flooring.test', name: 'Flooring Fitter' },
];

export async function seedDemo(supabase: SupabaseClient) {
  const ids = await seedUsers(supabase, USERS);
  const { error: assignError } = await supabase
    .from('ts_assignments')
    .upsert({ tenant_id: TENANTS.construction, supervisor_id: ids['c-supervisor'], worker_id: ids['c-worker1'] }, { onConflict: 'tenant_id,worker_id' });
  if (assignError) throw assignError;

  // Platform team login: belongs to no business, opens /admin (web).
  const adminId = await findOrCreate(supabase, 'admin@platform.test');
  const { error: adminError } = await supabase.from('platform_admins').upsert({ user_id: adminId, note: 'local seed' }, { onConflict: 'user_id' });
  if (adminError) throw adminError;

  printLogins('Demo Flooring / Demo Construction:', USERS);
  console.log(`  ${'admin@platform.test'.padEnd(30)} platform admin (web: /admin)`);
  console.log('  supervisor@construction.test signs off worker1 only.');
}
