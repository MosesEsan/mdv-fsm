-- Core guards: stop API users changing fields that only the server may set.
--   profiles: role, tenant_id, active, id   (a worker must not promote themselves; the token hook trusts these)
--   tenants:  features                       (modules are switched on by us, via service_role / migrations)
-- SECURITY INVOKER triggers: current_user is 'authenticated'/'anon' for API calls, and the
-- function owner / service_role for trusted server code.

create or replace function private.profiles_guard_protected()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and (
       new.id        is distinct from old.id
    or new.tenant_id is distinct from old.tenant_id
    or new.role      is distinct from old.role
    or new.active    is distinct from old.active) then
    raise exception 'Role, business and account status can only be changed by the owner through the app''s admin tools'
      using errcode = '42501';
  end if;
  return new;
end
$$;

drop trigger if exists profiles_guard_protected on public.profiles;
create trigger profiles_guard_protected
  before update on public.profiles
  for each row execute function private.profiles_guard_protected();

create or replace function private.tenants_guard_features()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.features is distinct from old.features and current_user in ('authenticated', 'anon') then
    raise exception 'Features can only be switched on or off by the platform team' using errcode = '42501';
  end if;
  return new;
end
$$;

drop trigger if exists tenants_guard_features on public.tenants;
create trigger tenants_guard_features
  before update of features on public.tenants
  for each row execute function private.tenants_guard_features();
