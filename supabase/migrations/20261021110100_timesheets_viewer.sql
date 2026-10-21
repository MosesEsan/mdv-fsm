-- Timesheets: the read-only viewer role sees every person's timesheets in its business.
-- Writes are refused by core's zz_block_viewer_writes triggers.

create or replace function private.ts_can_access_worker(p_worker uuid)
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select p_worker = auth.uid()
      or private.is_manager()
      or private.is_viewer()
      or (private.is_supervisor() and exists (
            select 1 from public.ts_assignments a
             where a.tenant_id = private.current_tenant_id()
               and a.supervisor_id = auth.uid()
               and a.worker_id = p_worker))
$$;

