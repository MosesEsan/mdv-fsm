-- Core role "viewer": read-only access for office/accounts staff (MDC calls it "Accounts Administrator"
-- through branding roleLabels). The token hook is unchanged: it already copies profiles.role into app_role.
--   * reads what members read, plus every timesheet in the business (entries, weeks, history)
--   * can't add, change or delete anything: a statement trigger on every business table refuses writes
--     made with a viewer's token, including through SECURITY DEFINER functions
--   * exceptions: profiles (own name, guarded elsewhere), file_exports and ts_events (recording an export)

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('owner', 'manager', 'supervisor', 'worker', 'fitter', 'viewer'));

create or replace function private.is_viewer()
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select coalesce(private.app_role() = 'viewer', false)
$$;

create or replace function private.block_viewer_writes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if private.is_viewer() then
    raise exception 'Your account can view and export, but can''t make changes.' using errcode = '42501';
  end if;
  return null;
end
$$;

-- Every business table, now and (checked by pgTAP) in future migrations.
do $$
declare t text;
begin
  for t in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r'
       and c.relname not in ('profiles', 'file_exports', 'ts_events', 'platform_admins', 'platform_audit')
  loop
    execute format('drop trigger if exists zz_block_viewer_writes on public.%I', t);
    execute format('create trigger zz_block_viewer_writes before insert or update or delete on public.%I
                    for each statement execute function private.block_viewer_writes()', t);
  end loop;
end
$$;

-- Role lists that name every role.
create or replace function private.validate_branding(p_tenant uuid, p jsonb)
returns jsonb
language plpgsql immutable
set search_path = ''
as $$
declare
  k text;
  v jsonb;
  ratio numeric;
begin
  if p is null or jsonb_typeof(p) <> 'object' then
    raise exception 'Branding must be an object' using errcode = '22023';
  end if;
  for k in select jsonb_object_keys(p) loop
    if k not in ('logoPath', 'colors', 'pdfName', 'roleLabels') then
      raise exception 'Branding: unknown field "%"', k using errcode = '22023';
    end if;
  end loop;

  if p ? 'logoPath' and jsonb_typeof(p -> 'logoPath') <> 'null' and not (
       jsonb_typeof(p -> 'logoPath') = 'string'
       and p ->> 'logoPath' like p_tenant::text || '/logo/%'
       and p ->> 'logoPath' not like '%..%') then
    raise exception 'Branding: the logo must be stored in this business''s logo folder' using errcode = '22023';
  end if;

  if p ? 'colors' then
    if jsonb_typeof(p -> 'colors') <> 'object' then
      raise exception 'Branding: colors must be an object' using errcode = '22023';
    end if;
    for k, v in select key, value from jsonb_each(p -> 'colors') loop
      if k not in ('primary', 'accent') then
        raise exception 'Branding: unknown colour "%"', k using errcode = '22023';
      end if;
      if jsonb_typeof(v) <> 'string' or (v #>> '{}') !~ '^#[0-9A-Fa-f]{6}$' then
        raise exception 'Branding: % colour must look like #1F6FEB', k using errcode = '22023';
      end if;
      ratio := private.contrast_with_white(v #>> '{}');
      if ratio < 4.5 then
        raise exception 'Branding: the % colour is too light for white text (contrast %:1, needs 4.5:1). Pick a darker shade.', k, ratio
          using errcode = '22023';
      end if;
    end loop;
  end if;

  if p ? 'pdfName' and not (jsonb_typeof(p -> 'pdfName') = 'string' and length(btrim(p ->> 'pdfName')) between 1 and 100) then
    raise exception 'Branding: the name on documents must be 1–100 characters' using errcode = '22023';
  end if;

  if p ? 'roleLabels' then
    if jsonb_typeof(p -> 'roleLabels') <> 'object' then
      raise exception 'Branding: job titles must be an object' using errcode = '22023';
    end if;
    for k, v in select key, value from jsonb_each(p -> 'roleLabels') loop
      if k not in ('owner', 'manager', 'supervisor', 'worker', 'fitter', 'viewer') then
        raise exception 'Branding: unknown role "%"', k using errcode = '22023';
      end if;
      if jsonb_typeof(v) <> 'string' or length(btrim(v #>> '{}')) not between 1 and 40 then
        raise exception 'Branding: the job title for % must be 1–40 characters', k using errcode = '22023';
      end if;
    end loop;
  end if;

  return p;
end
$$;

create or replace function public.platform_add_member(p_tenant uuid, p_user uuid, p_full_name text, p_role text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.profiles;
begin
  perform public.platform_get_tenant(p_tenant);
  if p_role not in ('owner', 'manager', 'supervisor', 'worker', 'fitter', 'viewer') then
    raise exception 'Unknown role "%"', p_role using errcode = '22023';
  end if;
  if not exists (select 1 from auth.users where id = p_user) then
    raise exception 'Login not found' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.profiles where id = p_user) then
    raise exception 'This person already belongs to a business' using errcode = '23505';
  end if;
  insert into public.profiles (id, tenant_id, full_name, role)
  values (p_user, p_tenant, nullif(btrim(coalesce(p_full_name, '')), ''), p_role)
  returning * into v;
  perform private.platform_log('member_added', p_tenant, jsonb_build_object('user_id', p_user, 'role', p_role, 'full_name', v.full_name));
  return v;
end
$$;

create or replace function public.platform_update_member(p_user uuid, p_full_name text, p_role text, p_active boolean)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.profiles;
  v     public.profiles;
begin
  perform private.require_platform_admin();
  select * into v_old from public.profiles where id = p_user;
  if not found then
    raise exception 'Person not found' using errcode = 'P0002';
  end if;
  if p_role not in ('owner', 'manager', 'supervisor', 'worker', 'fitter', 'viewer') then
    raise exception 'Unknown role "%"', p_role using errcode = '22023';
  end if;
  update public.profiles
     set full_name = nullif(btrim(coalesce(p_full_name, '')), ''), role = p_role, active = coalesce(p_active, active)
   where id = p_user returning * into v;
  perform private.platform_log('member_updated', v.tenant_id, jsonb_build_object(
    'user_id', p_user,
    'before', jsonb_build_object('full_name', v_old.full_name, 'role', v_old.role, 'active', v_old.active),
    'after', jsonb_build_object('full_name', v.full_name, 'role', v.role, 'active', v.active)));
  return v;
end
$$;

create or replace function private.team_role_ok(p_role text)
returns boolean language sql immutable set search_path = '' as $$
  select p_role in ('manager', 'supervisor', 'worker', 'fitter', 'viewer')
$$;
