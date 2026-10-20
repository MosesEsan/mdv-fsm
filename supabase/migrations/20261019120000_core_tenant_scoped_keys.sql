-- Core: tenant-scoped helper functions and composite keys.
--
-- Assumes Stage 0 core already exists: public.tenants, public.profiles, public.jobs,
-- and a custom access token hook that adds `tenant_id` and `app_role` claims.
-- NOTE: the role claim must NOT be called `role` — Supabase already uses `role`
-- ('authenticated' / 'anon') to pick the Postgres role.
--
-- Functions use `create or replace` so this is safe if core already defines them.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.current_tenant_id()
returns uuid
language sql stable
set search_path = ''
as $$
  select nullif(auth.jwt() ->> 'tenant_id', '')::uuid
$$;

create or replace function private.app_role()
returns text
language sql stable
set search_path = ''
as $$
  select auth.jwt() ->> 'app_role'
$$;

create or replace function private.is_owner()
returns boolean
language sql stable
set search_path = ''
as $$
  select coalesce(private.app_role() = 'owner', false)
$$;

-- Owners and managers can see and manage the whole tenant's module data.
create or replace function private.is_manager()
returns boolean
language sql stable
set search_path = ''
as $$
  select coalesce(private.app_role() in ('owner', 'manager'), false)
$$;

-- Supervisors (e.g. a foreman) act for the people assigned to them in a module.
-- Requires core roles: owner | manager | supervisor | <worker roles such as fitter, worker>.
create or replace function private.is_supervisor()
returns boolean
language sql stable
set search_path = ''
as $$
  select coalesce(private.app_role() = 'supervisor', false)
$$;

-- Generic feature-flag check against tenants.features.
-- Accepts {"<module>": true} or {"<module>": {"enabled": true}}.
-- Core knows nothing about specific modules; it just reads a key.
create or replace function private.feature_enabled(p_feature text)
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select coalesce((
    select case jsonb_typeof(t.features -> p_feature)
             when 'boolean' then (t.features ->> p_feature)::boolean
             when 'object'  then coalesce((t.features -> p_feature ->> 'enabled')::boolean, false)
             else false
           end
      from public.tenants t
     where t.id = private.current_tenant_id()
  ), false)
$$;

-- Composite unique keys so module tables can use (tenant_id, x_id) foreign keys.
-- This makes it impossible to point a row at another tenant's job or person,
-- even by guessing a UUID.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_tenant_id_id_key') then
    alter table public.profiles add constraint profiles_tenant_id_id_key unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'jobs_tenant_id_id_key') then
    alter table public.jobs add constraint jobs_tenant_id_id_key unique (tenant_id, id);
  end if;
end $$;
