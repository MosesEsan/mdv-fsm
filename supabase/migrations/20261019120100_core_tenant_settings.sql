-- Core: per-tenant settings.
--   tenants.features = which modules are switched on
--   tenants.settings = how each module behaves, namespaced: {"timesheets": {...}, "jobs": {...}}
--
-- Stored values are PARTIAL: only what the owner has set. Defaults are applied
-- by the Zod schema in the app and by each module's SQL defaults function.
-- Both are checked against one shared fixture in tests so they cannot drift.
--
-- Module registration is by naming convention (no registry table, so no
-- tenant-less table and no core → module dependency). A module provides:
--   private.settings_validate__<namespace>(jsonb) returns jsonb  -- raise on bad input, return cleaned value
--   private.settings_defaults__<namespace>()      returns jsonb

alter table public.tenants
  add column if not exists settings jsonb not null default '{}'::jsonb,
  add column if not exists timezone text not null default 'Europe/Dublin';

alter table public.tenants
  add constraint tenants_settings_is_object check (jsonb_typeof(settings) = 'object');

comment on column public.tenants.settings is
  'Per-module behaviour settings, namespaced by module. Partial; defaults applied in app + module SQL. Write only via update_tenant_settings().';
comment on column public.tenants.timezone is
  'IANA timezone used to work out local dates (e.g. which day/week a shift belongs to).';

-- Block direct writes to tenants.settings from API users (even owners).
-- update_tenant_settings() is SECURITY DEFINER, so it runs as the function owner and passes.
create or replace function private.tenants_guard_settings()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.settings is distinct from old.settings
     and current_user in ('authenticated', 'anon') then
    raise exception 'Settings can only be changed through update_tenant_settings()'
      using errcode = '42501';
  end if;
  return new;
end
$$;

drop trigger if exists tenants_guard_settings on public.tenants;
create trigger tenants_guard_settings
  before update of settings on public.tenants
  for each row execute function private.tenants_guard_settings();

-- Dispatch to the module's validator.
create or replace function private.validate_module_settings(p_namespace text, p_value jsonb)
returns jsonb
language plpgsql stable
security definer
set search_path = ''
as $$
declare
  v_out jsonb;
begin
  if p_namespace is null or p_namespace !~ '^[a-z][a-z0-9_]{0,40}$' then
    raise exception 'Invalid settings namespace' using errcode = '22023';
  end if;
  if to_regprocedure(format('private.settings_validate__%s(jsonb)', p_namespace)) is null then
    raise exception 'Unknown settings namespace: %', p_namespace using errcode = '22023';
  end if;
  if p_value is null or jsonb_typeof(p_value) <> 'object' then
    raise exception 'Settings for % must be an object', p_namespace using errcode = '22023';
  end if;

  execute format('select private.%I($1)', 'settings_validate__' || p_namespace)
    into v_out using p_value;
  return v_out;
end
$$;

-- Owner-only write path. Replaces one namespace; other namespaces are untouched,
-- so two edits to different modules can't overwrite each other.
create or replace function public.update_tenant_settings(p_namespace text, p_value jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant uuid := private.current_tenant_id();
  v_clean  jsonb;
  v_result jsonb;
begin
  if v_tenant is null then
    raise exception 'No tenant on this session' using errcode = '42501';
  end if;
  if not private.is_owner() then
    raise exception 'Only the owner can change settings' using errcode = '42501';
  end if;

  v_clean := private.validate_module_settings(p_namespace, p_value);

  update public.tenants
     set settings = jsonb_set(settings, array[p_namespace], v_clean, true)
   where id = v_tenant
  returning settings into v_result;

  return v_result;
end
$$;

revoke all on function public.update_tenant_settings(text, jsonb) from public, anon;
grant execute on function public.update_tenant_settings(text, jsonb) to authenticated;
revoke all on function private.validate_module_settings(text, jsonb) from public, anon, authenticated;

-- Reading: tenant members read their own tenant row (expected to exist in core).
-- Created here only if core has no SELECT policy on tenants yet.
alter table public.tenants enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'tenants' and cmd in ('SELECT', 'ALL')
  ) then
    create policy tenants_select_own on public.tenants
      for select to authenticated
      using (id = (select private.current_tenant_id()));
  end if;
end $$;

-- Realtime: settings changes reach field devices live (RLS still applies).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tenants'
     ) then
    alter publication supabase_realtime add table public.tenants;
  end if;
end $$;
