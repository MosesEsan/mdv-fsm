-- Core: platform admin — the team running the platform sets up businesses.
--   platform_admins   who we are (outside every business; never in a client's people list)
--   platform_audit    every admin action: who, what, which business, before/after
--   platform_* RPCs   the only way in: SECURITY DEFINER, check the caller, write the audit
--   branding          validated (colours readable with white text, logo path in the tenant folder);
--                     app users can no longer change tenants.branding directly
--   'branding' bucket private logos: members of the business read, platform admins write
-- Platform tables have no tenant_id on purpose: they describe the platform, not a business's data.

-------------------------------------------------------------------------------
-- Who is a platform admin
-------------------------------------------------------------------------------

create table public.platform_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
-- No policies: nobody reads or writes this through the API. Added by us with the service role or SQL.
revoke all on public.platform_admins from anon, authenticated;
grant select on public.platform_admins to supabase_auth_admin;
create policy platform_admins_auth_hook_select on public.platform_admins for select to supabase_auth_admin using (true);

-- Claim in the token AND still listed (so removing someone takes effect at once, not at token expiry).
create or replace function private.is_platform_admin()
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'platform_admin')::boolean, false)
     and exists (select 1 from public.platform_admins a where a.user_id = auth.uid())
$$;

create or replace function private.require_platform_admin()
returns void
language plpgsql stable
security definer
set search_path = ''
as $$
begin
  if not private.is_platform_admin() then
    raise exception 'Only the platform team can do this' using errcode = '42501';
  end if;
end
$$;

-- Token hook: unchanged behaviour (tenant_id + app_role from an active profile) plus platform_admin.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  p      record;
  claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
begin
  select tenant_id, role into p from public.profiles where id = (event ->> 'user_id')::uuid and active;
  if found then
    claims := jsonb_set(jsonb_set(claims, '{tenant_id}', to_jsonb(p.tenant_id::text), true), '{app_role}', to_jsonb(p.role), true);
  end if;
  if exists (select 1 from public.platform_admins a where a.user_id = (event ->> 'user_id')::uuid) then
    claims := jsonb_set(claims, '{platform_admin}', 'true'::jsonb, true);
  end if;
  return jsonb_set(event, '{claims}', claims, true);
end
$$;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-------------------------------------------------------------------------------
-- Audit
-------------------------------------------------------------------------------

create table public.platform_audit (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid not null,
  action     text not null check (action ~ '^[a-z][a-z_]{2,40}$'),
  tenant_id  uuid references public.tenants (id) on delete set null,
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index platform_audit_tenant_idx on public.platform_audit (tenant_id, created_at desc);
create index platform_audit_created_idx on public.platform_audit (created_at desc);
alter table public.platform_audit enable row level security;
-- Read through platform_audit_log(); never written or changed by the API.
revoke all on public.platform_audit from anon, authenticated;

create or replace function private.platform_log(p_action text, p_tenant uuid, p_detail jsonb default '{}'::jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.platform_audit (admin_id, action, tenant_id, detail)
  values (auth.uid(), p_action, p_tenant, coalesce(p_detail, '{}'::jsonb))
$$;
revoke all on function private.platform_log(text, uuid, jsonb) from public, anon, authenticated;

-------------------------------------------------------------------------------
-- Branding: validation + guard
-------------------------------------------------------------------------------

-- WCAG contrast of a #RRGGBB colour against white text.
create or replace function private.contrast_with_white(p_hex text)
returns numeric
language sql immutable
set search_path = ''
as $$
  with c as (
    select ('x' || substr(p_hex, 2, 2))::bit(8)::int / 255.0 as r,
           ('x' || substr(p_hex, 4, 2))::bit(8)::int / 255.0 as g,
           ('x' || substr(p_hex, 6, 2))::bit(8)::int / 255.0 as b
  ), lin as (
    select case when r <= 0.03928 then r / 12.92 else power((r + 0.055) / 1.055, 2.4) end as r,
           case when g <= 0.03928 then g / 12.92 else power((g + 0.055) / 1.055, 2.4) end as g,
           case when b <= 0.03928 then b / 12.92 else power((b + 0.055) / 1.055, 2.4) end as b
      from c
  )
  select round(1.05 / (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05), 2) from lin
$$;

-- tenants.branding = { logoPath?, colors?: { primary?, accent? }, pdfName?, roleLabels?: { owner?, manager?, supervisor?, worker?, fitter? } }
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
      if k not in ('owner', 'manager', 'supervisor', 'worker', 'fitter') then
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

-- App users (including owners) can't change branding directly; only platform functions can.
create or replace function private.tenants_guard_branding()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.branding is distinct from old.branding and current_user in ('authenticated', 'anon') then
    raise exception 'Branding is set up by the platform team' using errcode = '42501';
  end if;
  return new;
end
$$;
drop trigger if exists tenants_guard_branding on public.tenants;
create trigger tenants_guard_branding
  before update of branding on public.tenants
  for each row execute function private.tenants_guard_branding();

-------------------------------------------------------------------------------
-- Settings: which tenant a validator is checking (owner path or platform path)
-------------------------------------------------------------------------------

create or replace function private.settings_tenant_id()
returns uuid
language sql stable
set search_path = ''
as $$
  select coalesce(nullif(current_setting('app.settings_tenant', true), '')::uuid, private.current_tenant_id())
$$;

-- Owner path: same as before, but tells validators which tenant they're checking.
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
  perform set_config('app.settings_tenant', v_tenant::text, true);

  v_clean := private.validate_module_settings(p_namespace, p_value);

  update public.tenants
     set settings = jsonb_set(settings, array[p_namespace], v_clean, true)
   where id = v_tenant
  returning settings into v_result;

  return v_result;
end
$$;

-------------------------------------------------------------------------------
-- Platform RPCs
-------------------------------------------------------------------------------

create or replace function public.platform_whoami()
returns boolean
language sql stable
security definer
set search_path = ''
as $$ select private.is_platform_admin() $$;

create or replace function public.platform_list_tenants()
returns table (id uuid, name text, timezone text, features jsonb, branding jsonb, created_at timestamptz,
               people integer, active_people integer, owners integer)
language plpgsql stable
security definer
set search_path = ''
as $$
begin
  perform private.require_platform_admin();
  return query
  select t.id, t.name, t.timezone, t.features, t.branding, t.created_at,
         count(p.id)::int, count(p.id) filter (where p.active)::int, count(p.id) filter (where p.role = 'owner' and p.active)::int
    from public.tenants t
    left join public.profiles p on p.tenant_id = t.id
   group by t.id
   order by lower(t.name);
end
$$;

create or replace function public.platform_get_tenant(p_tenant uuid)
returns public.tenants
language plpgsql stable
security definer
set search_path = ''
as $$
declare
  v public.tenants;
begin
  perform private.require_platform_admin();
  select * into v from public.tenants where id = p_tenant;
  if not found then
    raise exception 'Business not found' using errcode = 'P0002';
  end if;
  return v;
end
$$;

create or replace function private.platform_check_timezone(p_tz text)
returns void
language plpgsql stable
set search_path = ''
as $$
begin
  if p_tz is null or not exists (select 1 from pg_catalog.pg_timezone_names where name = p_tz) then
    raise exception 'Unknown time zone "%". Use a name like Europe/Dublin.', coalesce(p_tz, '') using errcode = '22023';
  end if;
end
$$;

create or replace function public.platform_create_tenant(p_name text, p_timezone text default 'Europe/Dublin')
returns public.tenants
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.tenants;
begin
  perform private.require_platform_admin();
  if length(btrim(coalesce(p_name, ''))) not between 1 and 200 then
    raise exception 'Enter the business name' using errcode = '22023';
  end if;
  perform private.platform_check_timezone(p_timezone);
  insert into public.tenants (name, timezone) values (btrim(p_name), p_timezone) returning * into v;
  perform private.platform_log('tenant_created', v.id, jsonb_build_object('name', v.name, 'timezone', v.timezone));
  return v;
end
$$;

create or replace function public.platform_update_tenant(p_tenant uuid, p_name text, p_timezone text)
returns public.tenants
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.tenants := public.platform_get_tenant(p_tenant);
  v     public.tenants;
begin
  if length(btrim(coalesce(p_name, ''))) not between 1 and 200 then
    raise exception 'Enter the business name' using errcode = '22023';
  end if;
  perform private.platform_check_timezone(p_timezone);
  update public.tenants set name = btrim(p_name), timezone = p_timezone where id = p_tenant returning * into v;
  perform private.platform_log('tenant_updated', p_tenant, jsonb_build_object(
    'before', jsonb_build_object('name', v_old.name, 'timezone', v_old.timezone),
    'after', jsonb_build_object('name', v.name, 'timezone', v.timezone)));
  return v;
end
$$;

create or replace function public.platform_set_branding(p_tenant uuid, p_branding jsonb)
returns public.tenants
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.tenants := public.platform_get_tenant(p_tenant);
  v     public.tenants;
begin
  update public.tenants set branding = private.validate_branding(p_tenant, p_branding)
   where id = p_tenant returning * into v;
  perform private.platform_log('branding_set', p_tenant, jsonb_build_object('before', v_old.branding, 'after', v.branding));
  return v;
end
$$;

-- tenants.features: { "<module>": true | false | { "enabled": bool } }
create or replace function public.platform_set_features(p_tenant uuid, p_features jsonb)
returns public.tenants
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.tenants := public.platform_get_tenant(p_tenant);
  v     public.tenants;
  k     text;
  val   jsonb;
begin
  if p_features is null or jsonb_typeof(p_features) <> 'object' then
    raise exception 'Features must be an object' using errcode = '22023';
  end if;
  for k, val in select key, value from jsonb_each(p_features) loop
    if k !~ '^[a-z][a-z0-9_]{0,40}$' then
      raise exception 'Invalid module name "%"', k using errcode = '22023';
    end if;
    if not (jsonb_typeof(val) = 'boolean'
            or (jsonb_typeof(val) = 'object' and jsonb_typeof(val -> 'enabled') = 'boolean'
                and (select count(*) from jsonb_object_keys(val)) = 1)) then
      raise exception 'Module "%" must be true, false or {"enabled": true|false}', k using errcode = '22023';
    end if;
  end loop;

  update public.tenants set features = p_features where id = p_tenant returning * into v;
  perform private.platform_log('features_set', p_tenant, jsonb_build_object('before', v_old.features, 'after', v.features));
  return v;
end
$$;

create or replace function public.platform_set_module_settings(p_tenant uuid, p_namespace text, p_value jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old   public.tenants := public.platform_get_tenant(p_tenant);
  v_clean jsonb;
  v_new   jsonb;
begin
  perform set_config('app.settings_tenant', p_tenant::text, true);
  v_clean := private.validate_module_settings(p_namespace, p_value);
  update public.tenants set settings = jsonb_set(settings, array[p_namespace], v_clean, true)
   where id = p_tenant returning settings into v_new;
  perform private.platform_log('settings_set', p_tenant, jsonb_build_object(
    'namespace', p_namespace, 'before', v_old.settings -> p_namespace, 'after', v_clean));
  return v_new;
end
$$;

create or replace function public.platform_tenant_people(p_tenant uuid)
returns table (id uuid, full_name text, role text, active boolean, email text, invited_at timestamptz, last_sign_in_at timestamptz)
language plpgsql stable
security definer
set search_path = ''
as $$
begin
  perform private.require_platform_admin();
  return query
  select p.id, p.full_name, p.role, p.active, u.email::text, u.invited_at, u.last_sign_in_at
    from public.profiles p
    join auth.users u on u.id = p.id
   where p.tenant_id = p_tenant
   order by p.active desc, lower(coalesce(p.full_name, u.email::text));
end
$$;

-- Called by the platform-invite Edge Function after it creates the login.
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
  if p_role not in ('owner', 'manager', 'supervisor', 'worker', 'fitter') then
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
  if p_role not in ('owner', 'manager', 'supervisor', 'worker', 'fitter') then
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

create or replace function public.platform_audit_log(p_tenant uuid default null, p_limit integer default 100)
returns table (id uuid, created_at timestamptz, action text, tenant_id uuid, tenant_name text, admin_email text, detail jsonb)
language plpgsql stable
security definer
set search_path = ''
as $$
begin
  perform private.require_platform_admin();
  return query
  select a.id, a.created_at, a.action, a.tenant_id, t.name, u.email::text, a.detail
    from public.platform_audit a
    left join public.tenants t on t.id = a.tenant_id
    left join auth.users u on u.id = a.admin_id
   where p_tenant is null or a.tenant_id = p_tenant
   order by a.created_at desc
   limit least(greatest(coalesce(p_limit, 100), 1), 500);
end
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'platform_whoami()', 'platform_list_tenants()', 'platform_get_tenant(uuid)',
    'platform_create_tenant(text, text)', 'platform_update_tenant(uuid, text, text)',
    'platform_set_branding(uuid, jsonb)', 'platform_set_features(uuid, jsonb)',
    'platform_set_module_settings(uuid, text, jsonb)', 'platform_tenant_people(uuid)',
    'platform_add_member(uuid, uuid, text, text)', 'platform_update_member(uuid, text, text, boolean)',
    'platform_audit_log(uuid, integer)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-------------------------------------------------------------------------------
-- Storage: private logos. Members read their own business's; platform admins write.
-------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('branding', 'branding', false, 1048576, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy branding_read on storage.objects
  for select to authenticated
  using (bucket_id = 'branding'
         and ((storage.foldername(name))[1] = (select private.current_tenant_id())::text
              or (select private.is_platform_admin())));

create policy branding_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'branding' and (storage.foldername(name))[2] = 'logo' and (select private.is_platform_admin()));

create policy branding_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'branding' and (select private.is_platform_admin()))
  with check (bucket_id = 'branding' and (storage.foldername(name))[2] = 'logo' and (select private.is_platform_admin()));

create policy branding_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'branding' and (select private.is_platform_admin()));
