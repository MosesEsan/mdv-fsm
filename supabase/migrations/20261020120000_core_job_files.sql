-- Core: files attached to a job (photos now, PDFs later). Modules choose the `kind`
-- (e.g. 'viewing', 'completion'); core only checks its shape.
--
-- Storage: private bucket 'job-files', paths {tenant_id}/jobs/{job_id}/{kind}/{file}
-- (thumbnails under .../{kind}/thumbs/). A file can be read only if its job_files row can be
-- read, so the table's RLS decides for both.
--
-- Who can see a job's files: owner / manager, or someone booked on that job.
-- owner_only files (e.g. a quote PDF) are visible to the owner alone.

create or replace function private.can_access_job(p_job uuid)
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select private.is_manager()
      or (private.feature_enabled('scheduling') and exists (
            select 1 from public.bookings b
              join public.booking_assignees a on a.booking_id = b.id
             where b.job_id = p_job and b.tenant_id = private.current_tenant_id()
               and a.user_id = auth.uid()))
$$;

create table public.job_files (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants (id),
  job_id        uuid not null,
  kind          text not null check (kind ~ '^[a-z][a-z0-9_]{0,40}$'),
  path          text not null unique,
  thumb_path    text unique,
  content_type  text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  size_bytes    integer check (size_bytes between 1 and 10485760),
  width         integer,
  height        integer,
  caption       text check (length(caption) <= 500),
  owner_only    boolean not null default false,
  uploaded_by   uuid not null default auth.uid(),
  created_at    timestamptz not null default now(),
  constraint job_files_tenant_id_id_key unique (tenant_id, id),
  constraint job_files_job_fk foreign key (tenant_id, job_id) references public.jobs (tenant_id, id) on delete cascade,
  -- The stored path must sit in this job's folder for this kind.
  constraint job_files_path_shape check (
    path like tenant_id::text || '/jobs/' || job_id::text || '/' || kind || '/%' and path not like '%..%'
    and (thumb_path is null or (thumb_path like tenant_id::text || '/jobs/' || job_id::text || '/' || kind || '/thumbs/%'
                                and thumb_path not like '%..%')))
);
create index job_files_job_idx on public.job_files (tenant_id, job_id, kind, created_at);

alter table public.job_files enable row level security;

create policy job_files_select on public.job_files for select
  using (tenant_id = (select private.current_tenant_id())
         and private.can_access_job(job_id)
         and (not owner_only or (select private.is_owner())));

create policy job_files_insert on public.job_files for insert
  with check (tenant_id = (select private.current_tenant_id())
              and uploaded_by = auth.uid()
              and private.can_access_job(job_id)
              and (not owner_only or (select private.is_owner())));

create policy job_files_update on public.job_files for update
  using (tenant_id = (select private.current_tenant_id())
         and ((select private.is_manager()) or uploaded_by = auth.uid())
         and private.can_access_job(job_id))
  with check (tenant_id = (select private.current_tenant_id()) and private.can_access_job(job_id)
              and (not owner_only or (select private.is_owner())));

create policy job_files_delete on public.job_files for delete
  using (tenant_id = (select private.current_tenant_id())
         and ((select private.is_manager()) or uploaded_by = auth.uid())
         and private.can_access_job(job_id));

grant select, insert, delete on public.job_files to authenticated;
grant update (caption) on public.job_files to authenticated;

---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('job-files', 'job-files', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

-- Job id from a path like {tenant}/jobs/{job}/..., or null if it isn't one.
create or replace function private.job_files_path_job(p_name text)
returns uuid
language sql immutable
set search_path = ''
as $$
  select case when split_part(p_name, '/', 2) = 'jobs'
               and split_part(p_name, '/', 3) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then split_part(p_name, '/', 3)::uuid end
$$;

-- Read: only files whose job_files row this person can read (RLS on job_files applies here).
create policy job_files_storage_read on storage.objects for select to authenticated
  using (bucket_id = 'job-files'
         and split_part(name, '/', 1) = (select private.current_tenant_id())::text
         and exists (select 1 from public.job_files f where f.path = name or f.thumb_path = name));

-- Upload: into a job folder of a job this person can access. Never overwrite (no update policy).
create policy job_files_storage_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'job-files'
              and split_part(name, '/', 1) = (select private.current_tenant_id())::text
              and name not like '%..%'
              and private.can_access_job(private.job_files_path_job(name)));

-- Delete: whoever may delete the row (manager or uploader), or an upload left without a row.
create policy job_files_storage_delete on storage.objects for delete to authenticated
  using (bucket_id = 'job-files'
         and split_part(name, '/', 1) = (select private.current_tenant_id())::text
         and private.can_access_job(private.job_files_path_job(name))
         and ((select private.is_manager())
              or not exists (select 1 from public.job_files f where f.path = name or f.thumb_path = name)
              or exists (select 1 from public.job_files f where (f.path = name or f.thumb_path = name) and f.uploaded_by = auth.uid())));
