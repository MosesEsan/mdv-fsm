# CLAUDE.md

Start every session by reading, in order:

1. `docs/HANDOVER.md` — what the product is, the clients (AG Property Maintenance is the main focus), code map, how to work, what's next.
2. `AGENTS.md` — repo workflow and cloud commands.
3. `docs/BUILD-LOG.md` — what was built, in order.

Rules that always apply:

- Multi-tenant: every table has `tenant_id` and RLS. Schema changes only through new migrations in `supabase/migrations`, each with policies, indexes and pgTAP tests.
- Core never names a module; modules plug in through the registries in `src/core/modules` and `src/core/jobs/sections.ts`.
- Field roles never see prices (enforced by RLS).
- Never commit env files or keys. Never run seed scripts against production. Production Supabase deploys need explicit approval and `--yes-prod`.
- Before committing: typecheck, `npm test`, database tests. Conventional Commits.
- Keep `docs/BUILD-LOG.md`, `docs/HANDOVER.md` and the flows board (`design/flows-board/`) in step with the code.
- Client-facing text in plain English, no jargon. Lead with the answer.
