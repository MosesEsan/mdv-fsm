-- Core: generated files (exports, reports, PDFs) for every module.
--   file_exports           history of generated files, for re-downloading
--   storage bucket 'exports' private; paths are {tenant_id}/{module}/...
-- A module records a file through private.record_file_export() from its own SECURITY DEFINER RPC,
-- after checking its own rules. Readers: owner/manager of the same tenant, only while the module is on.
-- Convention: module = its feature key in tenants.features (and its settings namespace).

create table public.file_exports (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants (id) on delete cascade,
  module       text not null check (module ~ '^[a-z][a-z0-9_]{0,40}$'),
  title        text not null check (length(btrim(title)) between 1 and 200),
  format       text not null check (format in ('csv', 'pdf')),
  period_from  date,
  period_to    date,
  storage_path text not null,
  meta         jsonb not null default '{}'::jsonb check (jsonb_typeof(meta) = 'object'),
  created_by   uuid not null,
  created_at   timestamptz not null default now(),
  constraint file_exports_creator_fk foreign key (tenant_id, created_by) references public.profiles (tenant_id, id),
  constraint file_exports_period check (period_from is null or period_to is null or period_to >= period_from),
  constraint file_exports_path check (
    storage_path like tenant_id::text || '/' || module || '/%' and storage_path not like '%..%'
  )
);
create index file_exports_tenant_module_idx on public.file_exports (tenant_id, module, created_at desc);

alter table public.file_exports enable row level security;

create policy file_exports_select on public.file_exports
  for select to authenticated
  using (tenant_id = (select private.current_tenant_id())
         and (select private.is_manager())
         and private.feature_enabled(module));

revoke insert, update, delete on public.file_exports from anon, authenticated;

-- Called by module RPCs (SECURITY DEFINER) after their own checks. Not callable from the API.
create or replace function private.record_file_export(
  p_module text, p_title text, p_format text, p_from date, p_to date, p_storage_path text, p_meta jsonb default '{}'::jsonb
)
returns public.file_exports
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant uuid := private.current_tenant_id();
  v_row    public.file_exports;
begin
  if v_tenant is null or not private.is_manager() then
    raise exception 'Only the owner or a manager can create exports' using errcode = '42501';
  end if;
  if not private.feature_enabled(p_module) then
    raise exception 'This feature is not switched on' using errcode = '42501';
  end if;
  if p_storage_path is null or p_storage_path not like v_tenant::text || '/' || p_module || '/%' or p_storage_path like '%..%' then
    raise exception 'Invalid export file path' using errcode = '22023';
  end if;

  insert into public.file_exports (tenant_id, module, title, format, period_from, period_to, storage_path, meta, created_by)
  values (v_tenant, p_module, p_title, p_format, p_from, p_to, p_storage_path, coalesce(p_meta, '{}'::jsonb), auth.uid())
  returning * into v_row;
  return v_row;
end
$$;

revoke all on function private.record_file_export(text, text, text, date, date, text, jsonb) from public, anon, authenticated;

-- Storage: one private bucket. Uploads only from Edge Functions (service role).
insert into storage.buckets (id, name, public)
values ('exports', 'exports', false)
on conflict (id) do nothing;

create policy exports_manager_read on storage.objects
  for select to authenticated
  using (bucket_id = 'exports'
         and (storage.foldername(name))[1] = (select private.current_tenant_id())::text
         and (select private.is_manager())
         and private.feature_enabled((storage.foldername(name))[2]));
