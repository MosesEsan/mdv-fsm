-- Exports: the read-only viewer role (accounts) can create, list and download exports.

drop policy if exists file_exports_select on public.file_exports;
create policy file_exports_select on public.file_exports
  for select to authenticated
  using (tenant_id = (select private.current_tenant_id())
         and ((select private.is_manager()) or (select private.is_viewer()))
         and private.feature_enabled(module));

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
  if v_tenant is null or not (private.is_manager() or private.is_viewer()) then
    raise exception 'Your account can''t create exports' using errcode = '42501';
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

drop policy if exists exports_manager_read on storage.objects;
create policy exports_manager_read on storage.objects
  for select to authenticated
  using (bucket_id = 'exports'
         and (storage.foldername(name))[1] = (select private.current_tenant_id())::text
         and ((select private.is_manager()) or (select private.is_viewer()))
         and private.feature_enabled((storage.foldername(name))[2]));
