-- Module: extra work. Staff log work they did that wasn't in the job's instructions (what, why,
-- roughly how long, materials, photos) so it reaches the customer's invoice. The owner or a
-- manager ticks it "Added to invoice". No prices here: invoicing stays in the business's own software.
-- Switched on per business with tenants.features.extra_work. Builds on core job records.
--
-- Access follows the job (private.can_access_job):
--   staff on the job : see its extra work; log new entries while the job is open; edit or delete
--                      their own entries until they are added to an invoice
--   owner / manager  : everything, and the only ones who can mark entries added to an invoice

create table public.xw_entries (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants (id),
  job_id       uuid not null,
  logged_by    uuid not null default auth.uid(),
  what         text not null check (length(btrim(what)) between 1 and 300),
  why          text check (why is null or length(why) <= 1000),
  hours        numeric(4, 1) check (hours is null or (hours > 0 and hours <= 24)),
  materials    text check (materials is null or length(materials) <= 500),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  invoiced_at  timestamptz,
  invoiced_by  uuid,
  constraint xw_entries_tenant_id_id_key unique (tenant_id, id),
  constraint xw_entries_job_fk         foreign key (tenant_id, job_id)      references public.jobs (tenant_id, id) on delete cascade,
  constraint xw_entries_logged_by_fk   foreign key (tenant_id, logged_by)   references public.profiles (tenant_id, id),
  constraint xw_entries_invoiced_by_fk foreign key (tenant_id, invoiced_by) references public.profiles (tenant_id, id),
  constraint xw_entries_invoiced_shape check ((invoiced_at is null) = (invoiced_by is null))
);
create index xw_entries_job_idx on public.xw_entries (tenant_id, job_id, created_at desc);
create index xw_entries_open_idx on public.xw_entries (tenant_id, created_at desc) where invoiced_at is null;

-- Photos for an entry are ordinary job files (kind 'extra_work'), linked here so core stays unaware.
create table public.xw_entry_files (
  tenant_id   uuid not null references public.tenants (id),
  entry_id    uuid not null,
  file_id     uuid not null,
  created_at  timestamptz not null default now(),
  primary key (entry_id, file_id),
  constraint xw_entry_files_entry_fk foreign key (tenant_id, entry_id) references public.xw_entries (tenant_id, id) on delete cascade,
  constraint xw_entry_files_file_fk  foreign key (tenant_id, file_id)  references public.job_files (tenant_id, id) on delete cascade
);
create index xw_entry_files_file_idx on public.xw_entry_files (tenant_id, file_id);

create or replace function private.xw_entry_files_same_job()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
       select 1 from public.xw_entries e join public.job_files f on f.job_id = e.job_id and f.tenant_id = e.tenant_id
        where e.id = new.entry_id and f.id = new.file_id and e.tenant_id = new.tenant_id) then
    raise exception 'That photo belongs to a different job' using errcode = '23514';
  end if;
  return new;
end
$$;
create trigger xw_entry_files_same_job before insert on public.xw_entry_files
for each row execute function private.xw_entry_files_same_job();

create or replace function private.xw_entries_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.what := btrim(new.what);
  new.why := nullif(btrim(new.why), '');
  new.materials := nullif(btrim(new.materials), '');
  if tg_op = 'UPDATE' then
    new.updated_at := now();
    new.logged_by := old.logged_by;
    new.job_id := old.job_id;
  end if;
  return new;
end
$$;
create trigger xw_entries_touch before insert or update on public.xw_entries
for each row execute function private.xw_entries_touch();

---------------------------------------------------------------- RLS
alter table public.xw_entries enable row level security;
alter table public.xw_entry_files enable row level security;

create policy xw_entries_select on public.xw_entries for select
  using (tenant_id = (select private.current_tenant_id())
         and (select private.feature_enabled('extra_work'))
         and private.can_access_job(job_id));
create policy xw_entries_insert on public.xw_entries for insert
  with check (tenant_id = (select private.current_tenant_id())
              and (select private.feature_enabled('extra_work'))
              and logged_by = auth.uid()
              and invoiced_at is null
              and private.can_access_job(job_id)
              and ((select private.is_manager()) or private.job_is_open(job_id)));
create policy xw_entries_update on public.xw_entries for update
  using (tenant_id = (select private.current_tenant_id())
         and (select private.feature_enabled('extra_work'))
         and private.can_access_job(job_id)
         and ((select private.is_manager()) or (logged_by = auth.uid() and invoiced_at is null)))
  with check (tenant_id = (select private.current_tenant_id()));
create policy xw_entries_delete on public.xw_entries for delete
  using (tenant_id = (select private.current_tenant_id())
         and (select private.feature_enabled('extra_work'))
         and private.can_access_job(job_id)
         and ((select private.is_manager()) or (logged_by = auth.uid() and invoiced_at is null)));

-- An entry's photo links follow the entry (the subquery runs under the entry's RLS).
create policy xw_entry_files_select on public.xw_entry_files for select
  using (tenant_id = (select private.current_tenant_id())
         and exists (select 1 from public.xw_entries e where e.id = entry_id));
create policy xw_entry_files_insert on public.xw_entry_files for insert
  with check (tenant_id = (select private.current_tenant_id())
              and exists (select 1 from public.xw_entries e
                           where e.id = entry_id and e.invoiced_at is null
                             and ((select private.is_manager()) or e.logged_by = auth.uid())));
create policy xw_entry_files_delete on public.xw_entry_files for delete
  using (tenant_id = (select private.current_tenant_id())
         and exists (select 1 from public.xw_entries e
                      where e.id = entry_id and ((select private.is_manager()) or (e.logged_by = auth.uid() and e.invoiced_at is null))));

revoke all on public.xw_entries, public.xw_entry_files from anon, authenticated;
grant select, insert, delete on public.xw_entries to authenticated;
grant update (what, why, hours, materials) on public.xw_entries to authenticated;
grant select, insert, delete on public.xw_entry_files to authenticated;

---------------------------------------------------------------- functions
-- Owner or manager marks an entry as added to an invoice, or undoes it.
create or replace function public.xw_set_invoiced(p_entry uuid, p_invoiced boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.feature_enabled('extra_work') or not private.is_manager() then
    raise exception 'Only the owner or a manager can mark extra work as added to an invoice' using errcode = '42501';
  end if;
  update public.xw_entries
     set invoiced_at = case when p_invoiced then coalesce(invoiced_at, now()) end,
         invoiced_by = case when p_invoiced then coalesce(invoiced_by, auth.uid()) end
   where id = p_entry and tenant_id = private.current_tenant_id();
  if not found then
    raise exception 'Extra work entry not found' using errcode = 'P0002';
  end if;
end
$$;

-- Entries not yet on an invoice, per job (for badges on the jobs list). Runs as the caller.
create or replace function public.xw_open_counts()
returns table (job_id uuid, open_count integer)
language sql stable
security invoker
set search_path = ''
as $$
  select e.job_id, count(*)::integer
    from public.xw_entries e
   where e.invoiced_at is null and e.tenant_id = private.current_tenant_id()
   group by e.job_id
$$;

revoke all on function public.xw_set_invoiced(uuid, boolean) from public, anon;
grant execute on function public.xw_set_invoiced(uuid, boolean) to authenticated;
revoke all on function public.xw_open_counts() from public, anon;
grant execute on function public.xw_open_counts() to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'xw_entries') then
    alter publication supabase_realtime add table public.xw_entries;
  end if;
end $$;
