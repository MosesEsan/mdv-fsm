-- Core team management for the business owner (from the phone): see the team, invite, change role, deactivate.
-- Invites need the service role, so they go through the team-invite Edge Function, which calls team_add_member
-- as the owner. Everything else is a checked RPC. Owners can't create other owners or change themselves.

create table public.team_log (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id),
  actor_id   uuid not null default auth.uid(),
  action     text not null check (action in ('member_added', 'member_updated')),
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index team_log_tenant_idx on public.team_log (tenant_id, created_at desc);
alter table public.team_log enable row level security;
create policy team_log_owner_select on public.team_log for select
  using (tenant_id = (select private.current_tenant_id()) and (select private.is_owner()));
revoke all on public.team_log from anon, authenticated;
grant select on public.team_log to authenticated;

create or replace function private.require_owner()
returns uuid
language plpgsql stable
security definer
set search_path = ''
as $$
declare v uuid := private.current_tenant_id();
begin
  if v is null or not private.is_owner() then
    raise exception 'Only the owner can manage the team' using errcode = '42501';
  end if;
  return v;
end
$$;

-- Roles an owner can give from the app (owners are set up by us).
create or replace function private.team_role_ok(p_role text)
returns boolean language sql immutable set search_path = '' as $$
  select p_role in ('manager', 'supervisor', 'worker', 'fitter')
$$;

/** The team, with each person's email and whether they have signed in yet. Owner only. */
create or replace function public.team_members()
returns table (id uuid, full_name text, role text, active boolean, email text, signed_in boolean, created_at timestamptz)
language plpgsql stable
security definer
set search_path = ''
as $$
declare v_tenant uuid := private.require_owner();
begin
  return query
  select p.id, p.full_name, p.role, p.active, u.email::text, u.last_sign_in_at is not null, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
   where p.tenant_id = v_tenant
   order by p.active desc, (p.role = 'owner') desc, p.full_name;
end
$$;

/** Called by team-invite after it creates the login: puts the new person in the owner's business. */
create or replace function public.team_add_member(p_user uuid, p_full_name text, p_role text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant uuid := private.require_owner();
  v public.profiles;
begin
  if not private.team_role_ok(p_role) then
    raise exception 'Pick a role: manager, supervisor or worker' using errcode = '22023';
  end if;
  if length(btrim(coalesce(p_full_name, ''))) not between 1 and 120 then
    raise exception 'Enter their name' using errcode = '22023';
  end if;
  if not exists (select 1 from auth.users where id = p_user) then
    raise exception 'Login not found' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.profiles where id = p_user) then
    raise exception 'This person already belongs to a business' using errcode = '23505';
  end if;
  insert into public.profiles (id, tenant_id, full_name, role)
  values (p_user, v_tenant, btrim(p_full_name), p_role)
  returning * into v;
  insert into public.team_log (tenant_id, action, detail)
  values (v_tenant, 'member_added', jsonb_build_object('user_id', p_user, 'role', p_role, 'full_name', v.full_name));
  return v;
end
$$;

/** Change someone's name or role, or switch their access off and on. Not yourself, not other owners. */
create or replace function public.team_update_member(p_user uuid, p_full_name text, p_role text, p_active boolean)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant uuid := private.require_owner();
  v_old public.profiles;
  v public.profiles;
begin
  select * into v_old from public.profiles where id = p_user and tenant_id = v_tenant;
  if not found then
    raise exception 'Person not found' using errcode = 'P0002';
  end if;
  if p_user = auth.uid() then
    raise exception 'You can''t change your own role or access' using errcode = '42501';
  end if;
  if v_old.role = 'owner' then
    raise exception 'Owners are changed by the platform team' using errcode = '42501';
  end if;
  if not private.team_role_ok(p_role) then
    raise exception 'Pick a role: manager, supervisor or worker' using errcode = '22023';
  end if;
  if length(btrim(coalesce(p_full_name, ''))) not between 1 and 120 then
    raise exception 'Enter their name' using errcode = '22023';
  end if;
  update public.profiles
     set full_name = btrim(p_full_name), role = p_role, active = coalesce(p_active, active)
   where id = p_user
  returning * into v;
  insert into public.team_log (tenant_id, action, detail)
  values (v_tenant, 'member_updated', jsonb_build_object('user_id', p_user,
    'before', jsonb_build_object('full_name', v_old.full_name, 'role', v_old.role, 'active', v_old.active),
    'after', jsonb_build_object('full_name', v.full_name, 'role', v.role, 'active', v.active)));
  return v;
end
$$;

revoke all on function public.team_members() from public, anon;
revoke all on function public.team_add_member(uuid, text, text) from public, anon;
revoke all on function public.team_update_member(uuid, text, text, boolean) from public, anon;
grant execute on function public.team_members() to authenticated;
grant execute on function public.team_add_member(uuid, text, text) to authenticated;
grant execute on function public.team_update_member(uuid, text, text, boolean) to authenticated;
