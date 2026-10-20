-- Job files: booked staff can see a job's photos, nobody else can;
-- owner-only files stay with the owner; storage follows the table.
begin;
select plan(11);

insert into auth.users (id, email) values
  ('a3000000-0000-0000-0000-000000000001', 'owner@jf.test'),
  ('a3000000-0000-0000-0000-000000000002', 'fitter-on@jf.test'),
  ('a3000000-0000-0000-0000-000000000003', 'fitter-off@jf.test'),
  ('a3000000-0000-0000-0000-000000000004', 'manager@jf.test');
insert into public.tenants (id, name, features) values
  ('a3000000-0000-0000-0000-00000000000a', 'Floors JF', '{"scheduling": true}');
insert into public.profiles (id, tenant_id, full_name, role) values
  ('a3000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-00000000000a', 'Owner', 'owner'),
  ('a3000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-00000000000a', 'Fitter On', 'fitter'),
  ('a3000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-00000000000a', 'Fitter Off', 'fitter'),
  ('a3000000-0000-0000-0000-000000000004', 'a3000000-0000-0000-0000-00000000000a', 'Manager', 'manager');
insert into public.jobs (id, tenant_id, summary) values
  ('a3000000-0000-0000-0000-0000000000a1', 'a3000000-0000-0000-0000-00000000000a', 'Kitchen');
insert into public.bookings (id, tenant_id, job_id, starts_at, ends_at, created_by) values
  ('a3000000-0000-0000-0000-0000000000b1', 'a3000000-0000-0000-0000-00000000000a', 'a3000000-0000-0000-0000-0000000000a1',
   '2026-11-03 09:00+00', '2026-11-03 12:00+00', 'a3000000-0000-0000-0000-000000000001');
insert into public.booking_assignees (tenant_id, booking_id, user_id, time_range) values
  ('a3000000-0000-0000-0000-00000000000a', 'a3000000-0000-0000-0000-0000000000b1', 'a3000000-0000-0000-0000-000000000002', 'empty');

create function pg_temp.as_user(p_user uuid, p_role text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'tenant_id', 'a3000000-0000-0000-0000-00000000000a',
    'app_role', p_role, 'role', 'authenticated')::text, true) $$;

---------------------------------------------------------------- owner: viewing, rooms, photos
select pg_temp.as_user('a3000000-0000-0000-0000-000000000001', 'owner');
set local role authenticated;

select lives_ok($$ insert into storage.objects (bucket_id, name) values ('job-files', 'a3000000-0000-0000-0000-00000000000a/jobs/a3000000-0000-0000-0000-0000000000a1/viewing/p1.jpg') $$,
  'owner uploads a photo into the job folder');
select lives_ok($$ insert into public.job_files (tenant_id, job_id, kind, path, thumb_path, content_type, size_bytes)
  values ('a3000000-0000-0000-0000-00000000000a', 'a3000000-0000-0000-0000-0000000000a1', 'viewing',
          'a3000000-0000-0000-0000-00000000000a/jobs/a3000000-0000-0000-0000-0000000000a1/viewing/p1.jpg',
          'a3000000-0000-0000-0000-00000000000a/jobs/a3000000-0000-0000-0000-0000000000a1/viewing/thumbs/p1.jpg', 'image/jpeg', 120000) $$,
  'and records it against the job');
select throws_ok($$ insert into public.job_files (tenant_id, job_id, kind, path, content_type)
  values ('a3000000-0000-0000-0000-00000000000a', 'a3000000-0000-0000-0000-0000000000a1', 'viewing', 'somewhere/else.jpg', 'image/jpeg') $$,
  '23514', null, 'a file outside the job folder is refused');
insert into storage.objects (bucket_id, name) values ('job-files', 'a3000000-0000-0000-0000-00000000000a/jobs/a3000000-0000-0000-0000-0000000000a1/docs/quote.pdf');
insert into public.job_files (tenant_id, job_id, kind, path, content_type, owner_only)
values ('a3000000-0000-0000-0000-00000000000a', 'a3000000-0000-0000-0000-0000000000a1', 'docs',
        'a3000000-0000-0000-0000-00000000000a/jobs/a3000000-0000-0000-0000-0000000000a1/docs/quote.pdf', 'application/pdf', true);
select is((select count(*)::int from public.job_files), 2, 'owner sees all the job''s files');
reset role;

---------------------------------------------------------------- manager: not owner-only files
select pg_temp.as_user('a3000000-0000-0000-0000-000000000004', 'manager');
set local role authenticated;
select is((select count(*)::int from public.job_files), 1, 'a manager does not see owner-only files');
select is((select count(*)::int from storage.objects where bucket_id = 'job-files' and name like '%quote.pdf'), 0, '… nor can they download them');
reset role;

---------------------------------------------------------------- fitter booked on the job
select pg_temp.as_user('a3000000-0000-0000-0000-000000000002', 'fitter');
set local role authenticated;
select is((select count(*)::int from public.job_files), 1, 'a booked fitter sees the job''s photos');
select is((select count(*)::int from storage.objects where bucket_id = 'job-files'), 1, '… and can download the photo, not the quote');
reset role;

---------------------------------------------------------------- fitter not booked
select pg_temp.as_user('a3000000-0000-0000-0000-000000000003', 'fitter');
set local role authenticated;
select is((select count(*)::int from public.job_files), 0, 'a fitter not booked on the job sees no files');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('job-files', 'a3000000-0000-0000-0000-00000000000a/jobs/a3000000-0000-0000-0000-0000000000a1/viewing/x.jpg') $$,
  '42501', null, '… and cannot upload to it');
reset role;

update public.tenants set features = '{"scheduling": true}' where id = 'a3000000-0000-0000-0000-00000000000a';
select pg_temp.as_user('a3000000-0000-0000-0000-000000000001', 'owner');
set local role authenticated;
select is((select count(*)::int from public.job_files), 2, 'job files do not depend on any module being on');
reset role;

select * from finish();
rollback;
