// Seeds demo logins for local testing. Safe to run more than once.
// Needs: EXPO_PUBLIC_SUPABASE_URL (defaults to local), SUPABASE_SERVICE_ROLE_KEY, SEED_PASSWORD.
// Run supabase/seed.sql first (supabase db reset does that) so the tenants exist.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.SEED_PASSWORD;

const PHOTO_DIR = join(process.cwd(), 'scripts', 'demo-photos'); // run from the repo root (npm run seed:users)

const TENANTS = {
  flooring: '00000000-0000-0000-0000-000000000001',
  construction: '00000000-0000-0000-0000-000000000002',
  property: '00000000-0000-0000-0000-000000000003',
};

type SeedUser = { key: string; tenant: string; role: 'owner' | 'manager' | 'supervisor' | 'worker' | 'fitter'; email: string; name: string };

const USERS: SeedUser[] = [
  { key: 'c-owner', tenant: TENANTS.construction, role: 'owner', email: 'owner@construction.test', name: 'Construction Owner' },
  { key: 'c-manager', tenant: TENANTS.construction, role: 'manager', email: 'manager@construction.test', name: 'Construction Manager' },
  { key: 'c-supervisor', tenant: TENANTS.construction, role: 'supervisor', email: 'supervisor@construction.test', name: 'Construction Supervisor' },
  { key: 'c-worker1', tenant: TENANTS.construction, role: 'worker', email: 'worker1@construction.test', name: 'Construction Worker 1' },
  { key: 'c-worker2', tenant: TENANTS.construction, role: 'worker', email: 'worker2@construction.test', name: 'Construction Worker 2' },
  { key: 'f-owner', tenant: TENANTS.flooring, role: 'owner', email: 'owner@flooring.test', name: 'Flooring Owner' },
  { key: 'f-fitter', tenant: TENANTS.flooring, role: 'fitter', email: 'fitter@flooring.test', name: 'Flooring Fitter' },
  { key: 'p-owner', tenant: TENANTS.property, role: 'owner', email: 'owner@property.test', name: 'Arnis Gelsons' },
  { key: 'p-manager', tenant: TENANTS.property, role: 'manager', email: 'manager@property.test', name: 'Gary Nolan' },
  { key: 'p-adam', tenant: TENANTS.property, role: 'worker', email: 'adam@property.test', name: 'Adam Byrne' },
  { key: 'p-kasia', tenant: TENANTS.property, role: 'worker', email: 'kasia@property.test', name: 'Kasia Nowak' },
  { key: 'p-dean', tenant: TENANTS.property, role: 'worker', email: 'dean@property.test', name: 'Dean Fox' },
];

// Demo property business: who's on each job, the updates feed and extra work (invented).
const PJ = (n: number) => `00000000-0000-0000-0003-00000000000${n}`;
const PROPERTY_PEOPLE: Record<number, string[]> = {
  1: ['p-manager', 'p-adam', 'p-kasia'], 2: ['p-dean'], 3: ['p-kasia'], 4: [],
  5: ['p-manager', 'p-adam'], 6: ['p-manager', 'p-kasia'], 7: ['p-dean'], 8: ['p-adam'],
};
const PROPERTY_UPDATES: { id: string; job: number; by: string; at: string; body: string }[] = [
  { id: '00000000-0000-0000-0003-000000000101', job: 1, by: 'p-adam', at: '2026-10-13T16:40:00+01:00', body: 'Stripped out the old bath, tiles and vanity. Skip collected at 4.' },
  { id: '00000000-0000-0000-0003-000000000102', job: 1, by: 'p-kasia', at: '2026-10-15T15:55:00+01:00', body: 'New shower tray in and first fix plumbing done. Gary checked the falls.' },
  { id: '00000000-0000-0000-0003-000000000103', job: 1, by: 'p-manager', at: '2026-10-16T09:10:00+01:00', body: 'Checked the floor with Arnis. Customer happy with the layout. Tiling starts Monday.' },
  { id: '00000000-0000-0000-0003-000000000104', job: 1, by: 'p-adam', at: '2026-10-19T17:20:00+01:00', body: 'Walls tiled to two thirds. Floor tiles tomorrow.' },
  { id: '00000000-0000-0000-0003-000000000105', job: 3, by: 'p-kasia', at: '2026-10-19T16:30:00+01:00', body: 'Crack filled and sanded. First coat on the hall.' },
  { id: '00000000-0000-0000-0003-000000000106', job: 5, by: 'p-adam', at: '2026-07-22T17:00:00+01:00', body: 'Strip-out done.' },
  { id: '00000000-0000-0000-0003-000000000107', job: 5, by: 'p-manager', at: '2026-08-01T16:20:00+01:00', body: 'All finished. Customer signed off and very happy.' },
  { id: '00000000-0000-0000-0003-000000000108', job: 7, by: 'p-dean', at: '2026-10-06T15:00:00+01:00', body: 'Three panels replaced and posts re-set in concrete.' },
  { id: '00000000-0000-0000-0003-000000000109', job: 6, by: 'p-kasia', at: '2026-09-09T15:30:00+01:00', body: 'Finished and cleaned up.' },
  { id: '00000000-0000-0000-0003-000000000110', job: 8, by: 'p-adam', at: '2026-05-13T14:00:00+01:00', body: 'Regrouted and resealed.' },
];
const PROPERTY_EXTRA: { id: string; job: number; by: string; at: string; what: string; why: string; hours: number; materials: string; invoiced?: { by: string; at: string } }[] = [
  { id: '00000000-0000-0000-0003-000000000201', job: 1, by: 'p-adam', at: '2026-10-14T11:30:00+01:00', what: 'Replaced a rotten joist under the bath', why: 'Found when the old bath came out. Floor was soft.', hours: 2, materials: '1 length of 4x2 timber, screws' },
  { id: '00000000-0000-0000-0003-000000000202', job: 1, by: 'p-kasia', at: '2026-10-15T14:10:00+01:00', what: 'Moved the radiator 30 cm to the left', why: 'Customer asked on the day so the new vanity fits.', hours: 1.5, materials: '2 pipe extensions, valves' },
  { id: '00000000-0000-0000-0003-000000000203', job: 5, by: 'p-adam', at: '2026-07-24T12:00:00+01:00', what: 'Boxed in the soil pipe', why: 'Pipe was exposed once the old panel came off.', hours: 3, materials: 'Plasterboard, tiles', invoiced: { by: 'p-owner', at: '2026-08-02T10:00:00+01:00' } },
];

// Demo photos (labelled placeholders in scripts/demo-photos; swap in real photos with the same names).
// [file, job, stage, who, when, caption, update or extra-work id]
const U = (n: string) => `00000000-0000-0000-0003-000000000${n}`;
const PROPERTY_PHOTOS: [string, number, 'before' | 'progress' | 'completion', string, string, string, string?][] = [
  ['j1-before-1', 1, 'before', 'p-owner', '2026-10-12T17:05:00+01:00', 'Old bath'],
  ['j1-before-2', 1, 'before', 'p-owner', '2026-10-12T17:06:00+01:00', 'Old tiles'],
  ['j1-before-3', 1, 'before', 'p-owner', '2026-10-12T17:06:30+01:00', 'Window side'],
  ['j1-u1-1', 1, 'progress', 'p-adam', '2026-10-13T16:40:00+01:00', 'Stripped out', U('101')],
  ['j1-u1-2', 1, 'progress', 'p-adam', '2026-10-13T16:41:00+01:00', 'Skip', U('101')],
  ['j1-u2-1', 1, 'progress', 'p-kasia', '2026-10-15T15:55:00+01:00', 'Shower tray', U('102')],
  ['j1-u4-1', 1, 'progress', 'p-adam', '2026-10-19T17:20:00+01:00', 'Wall tiles', U('104')],
  ['j1-u4-2', 1, 'progress', 'p-adam', '2026-10-19T17:21:00+01:00', 'Corner', U('104')],
  ['j1-x1-1', 1, 'progress', 'p-adam', '2026-10-14T11:30:00+01:00', 'Rotten joist', 'x:' + U('201')],
  ['j1-x2-1', 1, 'progress', 'p-kasia', '2026-10-15T14:10:00+01:00', 'Radiator', 'x:' + U('202')],
  ['j2-before-1', 2, 'before', 'p-manager', '2026-10-19T15:40:00+01:00', 'Ceiling stain'],
  ['j3-before-1', 3, 'before', 'p-owner', '2026-10-15T12:20:00+01:00', 'Hall'],
  ['j3-u5-1', 3, 'progress', 'p-kasia', '2026-10-19T16:30:00+01:00', 'Hall first coat', U('105')],
  ['j5-before-1', 5, 'before', 'p-owner', '2026-07-15T10:00:00+01:00', 'Old bathroom'],
  ['j5-progress-1', 5, 'progress', 'p-adam', '2026-07-27T13:10:00+01:00', 'Tiling'],
  ['j5-u7-1', 5, 'completion', 'p-manager', '2026-08-01T16:20:00+01:00', 'Finished shower', U('107')],
  ['j5-completion-2', 5, 'completion', 'p-manager', '2026-08-01T16:21:00+01:00', 'Finished vanity'],
  ['j6-before-1', 6, 'before', 'p-owner', '2026-08-25T11:00:00+01:00', 'Ensuite'],
  ['j6-completion-1', 6, 'completion', 'p-kasia', '2026-09-09T15:30:00+01:00', 'Finished'],
  ['j7-before-1', 7, 'before', 'p-manager', '2026-10-05T09:00:00+01:00', 'Fence down'],
  ['j7-u8-1', 7, 'completion', 'p-dean', '2026-10-06T15:00:00+01:00', 'Fixed', U('108')],
  ['j8-before-1', 8, 'before', 'p-owner', '2026-05-08T10:00:00+01:00', 'Before'],
  ['j8-completion-1', 8, 'completion', 'p-adam', '2026-05-13T14:00:00+01:00', 'After'],
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

  // Demo property business: assignments, updates, extra work, who finished each job.
  for (const [job, keys] of Object.entries(PROPERTY_PEOPLE)) {
    const rows = keys.map((k) => ({ tenant_id: TENANTS.property, job_id: PJ(Number(job)), user_id: ids[k], added_by: ids['p-owner'] }));
    if (rows.length) {
      const { error } = await supabase.from('job_assignees').upsert(rows, { onConflict: 'job_id,user_id' });
      if (error) throw error;
    }
  }
  const { error: updError } = await supabase.from('job_updates').upsert(
    PROPERTY_UPDATES.map((u) => ({ id: u.id, tenant_id: TENANTS.property, job_id: PJ(u.job), author_id: ids[u.by], body: u.body, created_at: u.at })),
    { onConflict: 'id' },
  );
  if (updError) throw updError;
  const { error: xwError } = await supabase.from('xw_entries').upsert(
    PROPERTY_EXTRA.map((x) => ({
      id: x.id, tenant_id: TENANTS.property, job_id: PJ(x.job), logged_by: ids[x.by], what: x.what, why: x.why, hours: x.hours,
      materials: x.materials, created_at: x.at, invoiced_by: x.invoiced ? ids[x.invoiced.by] : null, invoiced_at: x.invoiced?.at ?? null,
    })),
    { onConflict: 'id' },
  );
  if (xwError) throw xwError;
  const { error: doneError } = await supabase
    .from('jobs')
    .update({ completed_by: ids['p-manager'] })
    .eq('tenant_id', TENANTS.property)
    .eq('status', 'completed');
  if (doneError) throw doneError;

  // Demo photos: upload each photo and thumbnail, then link it to its job, update or extra-work entry.
  for (const [i, [file, job, stage, by, at, caption, link]] of PROPERTY_PHOTOS.entries()) {
    const id = `00000000-0000-0000-0003-000000000${(300 + i).toString()}`;
    const base = `${TENANTS.property}/jobs/${PJ(job)}/photo`;
    const path = `${base}/${id}.jpg`;
    const thumbPath = `${base}/thumbs/${id}.jpg`;
    const body = readFileSync(join(PHOTO_DIR, `${file}.jpg`));
    const thumb = readFileSync(join(PHOTO_DIR, `${file}.thumb.jpg`));
    for (const [p, b] of [[path, body], [thumbPath, thumb]] as const) {
      const { error } = await supabase.storage.from('job-files').upload(p, b, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
    }
    const updateId = link && !link.startsWith('x:') ? link : null;
    const { error: fileError } = await supabase.from('job_files').upsert({
      id, tenant_id: TENANTS.property, job_id: PJ(job), kind: 'photo', path, thumb_path: thumbPath, content_type: 'image/jpeg',
      size_bytes: body.length, width: 1200, height: 900, caption, stage, update_id: updateId, uploaded_by: ids[by], created_at: at,
    }, { onConflict: 'id' });
    if (fileError) throw fileError;
    if (link?.startsWith('x:')) {
      const { error: linkError } = await supabase.from('xw_entry_files')
        .upsert({ tenant_id: TENANTS.property, entry_id: link.slice(2), file_id: id }, { onConflict: 'entry_id,file_id' });
      if (linkError) throw linkError;
    }
  }

  // Demo business logo (AG Property Maintenance): branding/{tenant}/logo/ag-logo.png, then point the branding at it.
  const logoPath = `${TENANTS.property}/logo/ag-logo.png`;
  const { error: logoError } = await supabase.storage.from('branding')
    .upload(logoPath, readFileSync(join(process.cwd(), 'scripts', 'demo-branding', 'ag-logo.png')), { contentType: 'image/png', upsert: true });
  if (logoError) throw logoError;
  const { error: brandError } = await supabase.from('tenants').update({
    branding: { colors: { primary: '#1973B3', accent: '#13406C' }, pdfName: 'AG Property Maintenance', logoPath },
  }).eq('id', TENANTS.property);
  if (brandError) throw brandError;

  // Platform team login: belongs to no business, opens /admin (web).
  const adminId = await findOrCreate('admin@platform.test');
  const { error: adminError } = await supabase.from('platform_admins').upsert({ user_id: adminId, note: 'local seed' }, { onConflict: 'user_id' });
  if (adminError) throw adminError;

  console.log('Seed logins (password = SEED_PASSWORD):');
  console.log(`  ${'admin@platform.test'.padEnd(30)} platform admin (web: /admin)`);
  for (const u of USERS) console.log(`  ${u.email.padEnd(30)} ${u.role}`);
  console.log('  supervisor@construction.test signs off worker1 only.');
  console.log('  property.test: AG Property Maintenance (job records and extra work). 23 demo photos from scripts/demo-photos.');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
