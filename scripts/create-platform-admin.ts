import { createClient } from '@supabase/supabase-js';
import { createInterface } from 'node:readline/promises';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const emailArg = process.argv.find((arg) => arg.startsWith('--email='))?.slice(8);
if (!url || !serviceRole) throw new Error('Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for the chosen project.');
if (!emailArg) throw new Error('Usage: npm run admin:create -- --email=person@example.com');

const prompt = createInterface({ input: process.stdin, output: process.stdout });
const password = await prompt.question('One-time password (it will be visible): ');
prompt.close();
if (password.length < 12) throw new Error('Use a one-time password of at least 12 characters.');

const client = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
const created = await client.auth.admin.createUser({ email: emailArg.trim().toLowerCase(), password, email_confirm: true });
if (created.error || !created.data.user) throw new Error(created.error?.message ?? 'Could not create the login.');
const inserted = await client.from('platform_admins').insert({ user_id: created.data.user.id, note: 'created by scripts/create-platform-admin.ts' });
if (inserted.error) {
  await client.auth.admin.deleteUser(created.data.user.id);
  throw new Error(inserted.error.message);
}
console.log(`Created platform admin ${emailArg}. Ask them to change the one-time password immediately.`);
