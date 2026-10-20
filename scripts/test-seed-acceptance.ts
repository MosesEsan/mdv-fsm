import assert from 'node:assert/strict';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const password = process.env.SEED_PASSWORD;
if (!url || !anonKey || !password) throw new Error('Set EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY and SEED_PASSWORD.');

const FLOORING = '00000000-0000-0000-0000-000000000001';
const CONSTRUCTION = '00000000-0000-0000-0000-000000000002';
const accounts = [
  ['owner@construction.test', CONSTRUCTION, 'owner'],
  ['manager@construction.test', CONSTRUCTION, 'manager'],
  ['supervisor@construction.test', CONSTRUCTION, 'supervisor'],
  ['worker1@construction.test', CONSTRUCTION, 'worker'],
  ['worker2@construction.test', CONSTRUCTION, 'worker'],
  ['owner@flooring.test', FLOORING, 'owner'],
  ['fitter@flooring.test', FLOORING, 'fitter'],
] as const;

type SignedIn = { client: SupabaseClient; userId: string };
const signedIn = new Map<string, SignedIn>();

function jwtClaims(token: string) {
  return JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString()) as { tenant_id?: string; app_role?: string };
}

async function login(email: string): Promise<SignedIn> {
  const client = createClient(url!, anonKey!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password: password! });
  assert.ifError(error);
  assert(data.session, `${email} did not receive a session`);
  return { client, userId: data.session.user.id };
}

async function main() {
  for (const [email, tenantId, role] of accounts) {
    const session = await login(email);
    signedIn.set(email, session);
    const { data } = await session.client.auth.getSession();
    const claims = jwtClaims(data.session!.access_token);
    assert.equal(claims.tenant_id, tenantId, `${email} received the wrong tenant claim`);
    assert.equal(claims.app_role, role, `${email} received the wrong role claim`);
  }
  console.log('✓ all seven seed logins work with the expected tenant and role claims');

  const supervisor = signedIn.get('supervisor@construction.test')!;
  const worker1 = signedIn.get('worker1@construction.test')!;
  const { data: assignments, error: assignmentError } = await supervisor.client
    .from('ts_assignments').select('worker_id').eq('supervisor_id', supervisor.userId);
  assert.ifError(assignmentError);
  assert.deepEqual(assignments?.map(row => row.worker_id), [worker1.userId]);
  console.log('✓ the supervisor sees only worker1 in their assignment scope');

  for (const email of ['owner@flooring.test', 'fitter@flooring.test']) {
    const client = signedIn.get(email)!.client;
    const { data: tenants, error: tenantError } = await client.from('tenants').select('id');
    assert.ifError(tenantError);
    assert.deepEqual(tenants?.map(row => row.id), [FLOORING], `${email} can see another tenant`);
    const { data: jobs, error: jobsError } = await client.from('jobs').select('tenant_id');
    assert.ifError(jobsError);
    assert(jobs?.length === 3 && jobs.every(row => row.tenant_id === FLOORING), `${email} can see construction jobs`);
  }
  console.log('✓ flooring users cannot see construction tenants or jobs');

  const owner = signedIn.get('owner@construction.test')!.client;
  const worker = worker1.client;
  const { data: before, error: beforeError } = await owner.from('tenants').select('settings').eq('id', CONSTRUCTION).single();
  assert.ifError(beforeError);
  const original = (before?.settings as Record<string, unknown> | null)?.timesheets ?? {};
  const nextMode = (original as { entryMode?: string }).entryMode === 'duration' ? 'start_end' : 'duration';

  let resolveUpdate!: () => void;
  let rejectUpdate!: (error: Error) => void;
  const updateSeen = new Promise<void>((resolve, reject) => { resolveUpdate = resolve; rejectUpdate = reject; });
  const channel = worker.channel('acceptance-settings-sync').on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'tenants', filter: `id=eq.${CONSTRUCTION}` },
    payload => {
      const settings = (payload.new as { settings?: { timesheets?: { entryMode?: string } } }).settings;
      if (settings?.timesheets?.entryMode === nextMode) resolveUpdate();
    },
  );
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Realtime subscription did not connect')), 10_000);
    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') { clearTimeout(timer); resolve(); }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { clearTimeout(timer); reject(new Error(`Realtime subscription failed: ${status}`)); }
    });
  });
  // A freshly started local Realtime container reports SUBSCRIBED before its
  // Postgres replication slot has finished initialising. Let that one-time
  // setup settle so the first database event is not lost.
  await new Promise(resolve => setTimeout(resolve, 1_500));
  const timeout = setTimeout(() => rejectUpdate(new Error('Worker did not receive the settings update over Realtime')), 10_000);
  try {
    const { error } = await owner.rpc('update_tenant_settings', { p_namespace: 'timesheets', p_value: { ...(original as object), entryMode: nextMode } });
    assert.ifError(error);
    await updateSeen;
    console.log('✓ an owner settings change reaches a signed-in worker over Realtime');
  } finally {
    clearTimeout(timeout);
    await owner.rpc('update_tenant_settings', { p_namespace: 'timesheets', p_value: original });
    await worker.removeChannel(channel);
    await Promise.all([...signedIn.values()].map(({ client }) => client.auth.signOut()));
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
