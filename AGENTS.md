# Repository workflow

Follow the React Native and Git rules supplied with the task. Cloud-specific commands:

- `npm run build:web` builds the Vercel SPA in `dist/`.
- `npm run deploy:supabase -- --env dev --dry-run` previews Supabase deployment.
- Production Supabase deployment always requires explicit approval and `--yes-prod`.
- `npm run admin:create -- --email=<EMAIL>` creates a platform admin using a service-role key from the environment.
- EAS build, submit and update scripts are listed in `package.json` and documented in `docs/deployment/deploy.md`.

Never commit target env files, credentials, seed passwords, service-role keys, App Store keys or Play service-account JSON. Never run local/demo seed scripts against production.
