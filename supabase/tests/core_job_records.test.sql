-- Job records: owners and managers run jobs; staff see only jobs they're on, post updates and
-- photos while the job is open, and can't change the job itself. Search finds words in updates.
-- Other businesses see nothing, and the feed is off unless the business has job_records on.
begin;
select plan(27);

insert into auth.users (id, email) values
  ('c1000000-0000-0000-0000-000000000001', 'owner@jr.test'),
  ('c1000000-0000-0000-0000-000000000002', 'manager@jr.test'),
  ('c1000000-0000-0000-0000-000000000003', 'worker-on@jr.test'),
  ('c1000000-0000-0000-0000-000000000004', 'worker-off@jr.test'),
  ('c2000000-0000-0000-0000-000000000001', 'owner@other.test'),
  ('c3000000-0000-0000-0000-000000000001', 'owner@nofeature.test'),
  ('c4000000-0000-0000-0000-000000000001', 'worker@timesheets.test');
insert into public.tenants (id, name, features) values
  ('c1000000-0000-0000-0000-00000000000a', 'Records Co', '{"job_records": true}'),
  ('c2000000-0000-0000-0000-00000000000a', 'Other Co', '{"job_records": true}'),
  ('c3000000-0000-0000-0000-00000000000a', 'No Feature Co', '{}'),
  ('c4000000-0000-0000-0000-00000000000a', 'Timesheets Co', '{"job_records": true, "timesheets": true}');
insert into public.profiles (id, tenant_id, full_name, role) values
  ('c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-00000000000a', 'Owner', 'owner'),
  ('c1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-00000000000a', 'Manager', 'manager'),
  ('c1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-00000000000a', 'Worker On', 'worker'),
  ('c1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-00000000000a', 'Worker Off', 'worker'),
  ('c2000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-00000000000a', 'Other Owner', 'owner'),
  ('c3000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-00000000000a', 'No Feature Owner', 'owner'),
  ('c4000000-0000-0000-0000-000000000001', 'c4000000-0000-0000-0000-00000000000a', 'Timesheets Worker', 'worker');
insert into public.jobs (id, tenant_id, summary, status) values
  ('c3000000-0000-0000-0000-0000000000a1', 'c3000000-0000-0000-0000-00000000000a', 'Gutters', 'todo'),
  ('c4000000-0000-0000-0000-0000000000a1', 'c4000000-0000-0000-0000-00000000000a', 'Site A', 'todo');

create function pg_temp.as_user(p_user uuid, p_tenant uuid, p_role text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'tenant_id', p_tenant,
    'app_role', p_role, 'role', 'authenticated')::text, true) $$;
create temp table ids (k text primary key, v uuid);
grant all on ids to authenticated;

---------------------------------------------------------------- owner creates a job with a new customer
select pg_temp.as_user('c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-00000000000a', 'owner');
set local role authenticated;

select lives_ok($$
  insert into ids select 'job', public.save_job(null, 'Bathroom renovation', null,
    'Strip out and retile. Tiles are in the garage.', '2026-10-22', null,
    '{"name": "Mary Collins", "phone": "087 412 6610", "address": "14 Main Street, Swords"}'::jsonb,
    array['c1000000-0000-0000-0000-000000000003']::uuid[]) $$,
  'owner creates a job, its customer and who is on it in one step');
select is((select status from public.jobs where id = (select v from ids where k = 'job')), 'todo', 'a new job starts as To do');
select is((select site_address from public.jobs where id = (select v from ids where k = 'job')), '14 Main Street, Swords',
  'a blank site address uses the customer''s address');
reset role;

---------------------------------------------------------------- staff on the job
select pg_temp.as_user('c1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-00000000000a', 'worker');
set local role authenticated;
select is((select count(*)::int from public.job_list('active')), 1, 'staff on the job see it in their list');
select is((select customer_name from public.job_record((select v from ids where k = 'job'))), 'Mary Collins',
  '… and the customer''s name on the job page');
select lives_ok($$ insert into public.job_updates (tenant_id, job_id, body)
  values ('c1000000-0000-0000-0000-00000000000a', (select v from ids where k = 'job'), 'Stripped out, skip collected. Floor tiles tomorrow.') $$,
  'staff on the job post an update');
reset role;
select is((select status from public.jobs where id = (select v from ids where k = 'job')), 'in_progress',
  'the first update moves the job to In progress');

select pg_temp.as_user('c1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-00000000000a', 'worker');
set local role authenticated;
insert into ids select 'upd', id from public.job_updates limit 1;
select lives_ok($$ insert into storage.objects (bucket_id, name) values ('job-files',
  'c1000000-0000-0000-0000-00000000000a/jobs/' || (select v from ids where k = 'job') || '/photo/p1.jpg') $$,
  'staff on the job upload a photo');
select lives_ok($$ insert into public.job_files (tenant_id, job_id, kind, path, content_type, stage, update_id)
  values ('c1000000-0000-0000-0000-00000000000a', (select v from ids where k = 'job'), 'photo',
          'c1000000-0000-0000-0000-00000000000a/jobs/' || (select v from ids where k = 'job') || '/photo/p1.jpg',
          'image/jpeg', 'progress', (select v from ids where k = 'upd')) $$,
  '… tagged Progress and linked to their update');
select throws_ok($$ insert into public.job_files (tenant_id, job_id, kind, path, content_type, stage)
  values ('c1000000-0000-0000-0000-00000000000a', (select v from ids where k = 'job'), 'photo',
          'c1000000-0000-0000-0000-00000000000a/jobs/' || (select v from ids where k = 'job') || '/photo/p2.jpg', 'image/jpeg', 'after') $$,
  '23514', null, 'a made-up photo stage is refused');
select throws_ok($$ insert into public.jobs (tenant_id, summary, status) values ('c1000000-0000-0000-0000-00000000000a', 'Sneaky job', 'todo') $$,
  '42501', null, 'staff cannot create jobs');
select throws_ok($$ insert into public.customers (tenant_id, name) values ('c1000000-0000-0000-0000-00000000000a', 'Sneaky customer') $$,
  '42501', null, '… or customers');
select throws_ok($$ insert into public.job_assignees (tenant_id, job_id, user_id)
  values ('c1000000-0000-0000-0000-00000000000a', (select v from ids where k = 'job'), 'c1000000-0000-0000-0000-000000000004') $$,
  '42501', null, 'staff cannot add people to a job');
update public.jobs set status = 'completed' where id = (select v from ids where k = 'job');
update public.jobs set instructions = 'Changed by staff' where id = (select v from ids where k = 'job');
select lives_ok($$ update public.job_updates set body = 'Stripped out, skip collected. Floor tiles and grout tomorrow.'
  where id = (select v from ids where k = 'upd') $$, 'staff fix their own update');
reset role;
select is((select status || ' / ' || coalesce(instructions, '') from public.jobs where id = (select v from ids where k = 'job')),
  'in_progress / Strip out and retile. Tiles are in the garage.', 'staff cannot change the job''s status or instructions');
select isnt((select edited_at from public.job_updates where id = (select v from ids where k = 'upd')), null, 'an edited update is marked as edited');

---------------------------------------------------------------- staff not on the job
select pg_temp.as_user('c1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-00000000000a', 'worker');
set local role authenticated;
select is((select count(*)::int from public.jobs), 0, 'staff not on a job cannot read it');
select is((select count(*)::int from public.job_updates) + (select count(*)::int from public.job_files), 0, '… nor its updates or photos');
select throws_ok($$ select * from public.job_record((select id from public.job_updates limit 1)) $$, '42501', null,
  '… and cannot open its page');
reset role;

---------------------------------------------------------------- search and completion
select pg_temp.as_user('c1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-00000000000a', 'manager');
set local role authenticated;
select is((select count(*)::int from public.job_list('all', 'grout')), 1, 'search finds a job by a word in its updates');
select is((select count(*)::int from public.job_list('all', 'bath')), 1, '… and by the start of a word ("bath" → bathroom)');
select is((select count(*)::int from public.job_list('all', 'conservatory')), 0, '… and nothing when nothing matches');
update public.jobs set status = 'completed' where id = (select v from ids where k = 'job');
select is((select completed_by from public.jobs where id = (select v from ids where k = 'job')),
  'c1000000-0000-0000-0000-000000000002'::uuid, 'completing a job records who completed it');
reset role;

select pg_temp.as_user('c1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-00000000000a', 'worker');
set local role authenticated;
select throws_ok($$ insert into public.job_updates (tenant_id, job_id, body)
  values ('c1000000-0000-0000-0000-00000000000a', (select v from ids where k = 'job'), 'One more thing') $$,
  '42501', null, 'staff cannot post on a completed job');
reset role;

---------------------------------------------------------------- other businesses and switches
select pg_temp.as_user('c2000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-00000000000a', 'owner');
set local role authenticated;
select is((select count(*)::int from public.job_list('all')) + (select count(*)::int from public.job_updates), 0,
  'another business sees none of these jobs or updates');
reset role;

select pg_temp.as_user('c3000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-00000000000a', 'owner');
set local role authenticated;
select throws_ok($$ insert into public.job_updates (tenant_id, job_id, body)
  values ('c3000000-0000-0000-0000-00000000000a', 'c3000000-0000-0000-0000-0000000000a1', 'Hello') $$,
  '42501', null, 'without job_records switched on, nobody can post updates');
reset role;

select pg_temp.as_user('c4000000-0000-0000-0000-000000000001', 'c4000000-0000-0000-0000-00000000000a', 'worker');
set local role authenticated;
select is((select count(*)::int from public.jobs), 1, 'with Timesheets on, staff still see job titles to log hours against');
reset role;

select * from finish();
rollback;
