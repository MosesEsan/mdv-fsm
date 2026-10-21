// Seeds demo logins and data for local testing. Safe to run more than once. Never run against production.
// Needs: EXPO_PUBLIC_SUPABASE_URL (defaults to local), SUPABASE_SERVICE_ROLE_KEY, SEED_PASSWORD.
// Run the SQL seeds first (supabase db reset loads supabase/seeds/*.sql) so the businesses exist.
//
//   npm run seed:users            every demo business
//   npm run seed:users -- ag      AG Property Maintenance only
//   npm run seed:users -- mdc     MDC Electrical (demo) only
//   npm run seed:users -- demo    Demo Flooring, Demo Construction and the platform admin
import { seedAg } from './seed/ag';
import { seedDemo } from './seed/demo';
import { seedMdc } from './seed/mdc';
import { adminClient } from './seed/shared';

const SEEDS = { demo: seedDemo, ag: seedAg, mdc: seedMdc } as const;
type Name = keyof typeof SEEDS;

async function main() {
  const asked = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const unknown = asked.filter((a) => !(a in SEEDS));
  if (unknown.length) throw new Error(`Unknown seed: ${unknown.join(', ')}. Use ${Object.keys(SEEDS).join(', ')}.`);
  const names = (asked.length ? asked : Object.keys(SEEDS)) as Name[];
  const supabase = adminClient();
  for (const n of names) await SEEDS[n](supabase);
  console.log('Password for every login = SEED_PASSWORD.');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
