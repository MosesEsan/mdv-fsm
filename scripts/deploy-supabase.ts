import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

type Target = { name: string; env: 'dev' | 'prod'; projectRef: string; kind: 'shared' | 'dedicated'; envFile: string };
const args = process.argv.slice(2);
const valueAfter = (flag: string) => { const i = args.indexOf(flag); return i < 0 ? undefined : args[i + 1]; };
const dryRun = args.includes('--dry-run');
const yesProd = args.includes('--yes-prod');
const envFilter = valueAfter('--env');
const nameFilter = valueAfter('--name');
if (envFilter && !['dev', 'prod'].includes(envFilter)) throw new Error('--env must be dev or prod');

const targets = JSON.parse(readFileSync(resolve('deploy/projects.json'), 'utf8')) as Target[];
const selected = targets.filter((t) => (!envFilter || t.env === envFilter) && (!nameFilter || t.name === nameFilter));
if (!selected.length) throw new Error('No Supabase targets matched. Use --env dev|prod or --name <target>.');
if (selected.some((t) => t.env === 'prod') && !yesProd) throw new Error('Production deployment refused. Review the target, then pass --yes-prod.');

const functions = readdirSync(resolve('supabase/functions'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== '_shared')
  .map((entry) => entry.name)
  .sort();

function run(command: string, commandArgs: string[], env: NodeJS.ProcessEnv, displayArgs = commandArgs) {
  console.log(`$ ${command} ${displayArgs.join(' ')}`);
  if (dryRun) return;
  const result = spawnSync(command, commandArgs, { stdio: 'inherit', env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

for (const target of selected) {
  if (!dryRun && /^<.*>$/.test(target.projectRef)) throw new Error(`${target.name} still has a placeholder projectRef.`);
  const envPath = resolve(target.envFile);
  if (!dryRun && !existsSync(envPath)) throw new Error(`Missing ${target.envFile}; copy deploy/env/.env.example and fill it locally or in CI.`);
  const targetEnv = { ...process.env };
  for (const line of (existsSync(envPath) ? readFileSync(envPath, 'utf8') : '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const at = trimmed.indexOf('=');
    if (at > 0) targetEnv[trimmed.slice(0, at)] = trimmed.slice(at + 1);
  }
  if (!dryRun && !targetEnv.SUPABASE_DB_PASSWORD) throw new Error(`${target.envFile} is missing SUPABASE_DB_PASSWORD.`);
  console.log(`\n== ${target.name} (${target.env}, ${target.kind}) ==`);
  const linkArgs = ['supabase', 'link', '--project-ref', target.projectRef, '--password', dryRun ? '<SUPABASE_DB_PASSWORD>' : targetEnv.SUPABASE_DB_PASSWORD!];
  run('npx', linkArgs, targetEnv, ['supabase', 'link', '--project-ref', target.projectRef, '--password', '<REDACTED>']);
  run('npx', ['supabase', 'db', 'push', '--include-all'], targetEnv);
  for (const fn of functions) run('npx', ['supabase', 'functions', 'deploy', fn, '--project-ref', target.projectRef], targetEnv);
  if (dryRun) {
    run('npx', ['supabase', 'secrets', 'set', '--project-ref', target.projectRef, '--env-file', '<FILTERED_EDGE_SECRETS>'], targetEnv);
  } else {
    const secretLines = readFileSync(envPath, 'utf8').split(/\r?\n/).filter((line) => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('SUPABASE_DB_PASSWORD=') && !trimmed.startsWith('SUPABASE_SERVICE_ROLE_KEY=') && !trimmed.endsWith('=');
    });
    if (secretLines.length) {
      const secretDir = mkdtempSync(resolve(tmpdir(), 'fsm-secrets-'));
      const filteredPath = resolve(secretDir, 'secrets.env');
      try {
        writeFileSync(filteredPath, `${secretLines.join('\n')}\n`, { mode: 0o600 });
        run('npx', ['supabase', 'secrets', 'set', '--project-ref', target.projectRef, '--env-file', filteredPath], targetEnv,
          ['supabase', 'secrets', 'set', '--project-ref', target.projectRef, '--env-file', '<REDACTED_TEMP_FILE>']);
      } finally {
        rmSync(secretDir, { recursive: true, force: true });
      }
    }
  }
}
