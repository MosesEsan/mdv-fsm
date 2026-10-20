-- Extra work: staff on a job log it; only the owner or a manager marks it added to an invoice;
-- once it's on an invoice staff can't change or remove it; others and other businesses see nothing.
begin;
select plan(15);

insert into auth.users (id, email) values
  ('d1000000-0000-0000-0000-000000000001', 'owner@xw.test'),
  ('d1000000-0000-0000-0000-000000000003', 'worker-on@xw.test'),
  ('d1000000-0000-0000-0000-000000000004', 'worker-off@xw.test'),
  ('d2000000-0000-0000-0000-000000000001', 'owner@xw-other.test'),
  ('d3000000-0000-0000-0000-000000000001', 'owner@xw-off.test');
insert into public.tenants (id, name, features) values
  ('d1000000-0000-0000-0000-00000000000a', 'Extra Co', '{"job_records": true, "extra_work": true}'),
  ('d2000000-0000-0000-0000-00000000000a', 'Other Co', '{"job_records": true, "extra_work": true}'),
  ('d3000000-0000-0000-0000-00000000000a', 'Off Co', '{"job_records": true}');
insert into public.profiles (id, tenant_id, full_name, role) values
  ('d1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-00000000000a', 'Owner', 'owner'),
  ('d1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-00000000000a', 'Worker On', 'worker'),
  ('d1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-00000000000a', 'Worker Off', 'worker'),
  ('d2000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-00000000000a', 'Other Owner', 'owner'),
  ('d3000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-00000000000a', 'Off Owner', 'owner');
insert into public.jobs (id, tenant_id, summary, status) values
  ('d1000000-0000-0000-0000-0000000000a1', 'd1000000-0000-0000-0000-00000000000a', 'Bathroom', 'in_progress'),
  ('d1000000-0000-0000-0000-0000000000a2', 'd1000000-0000-0000-0000-00000000000a', 'Fence', 'completed'),
  ('d1000000-0000-0000-0000-0000000000a3', 'd1000000-0000-0000-0000-00000000000a', 'Kitchen', 'in_progress'),
  ('d3000000-0000-0000-0000-0000000000a1', 'd3000000-0000-0000-0000-00000000000a', 'Gutters', 'in_progress');
insert into public.job_assignees (tenant_id, job_id, user_id, added_by) values
  ('d1000000-0000-0000-0000-00000000000a', 'd1000000-0000-0000-0000-0000000000a1', 'd1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001'),
  ('d1000000-0000-0000-0000-00000000000a', 'd1000000-0000-0000-0000-0000000000a2', 'd1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001'),
  ('d1000000-0000-0000-0000-00000000000a', 'd1000000-0000-0000-0000-0000000000a3', 'd1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001');
insert into public.job_files (id, tenant_id, job_id, kind, path, content_type, uploaded_by) values
  ('d1000000-0000-0000-0000-0000000000f3', 'd1000000-0000-0000-0000-00000000000a', 'd1000000-0000-0000-0000-0000000000a3', 'photo',
   'd1000000-0000-0000-0000-00000000000a/jobs/d1000000-0000-0000-0000-0000000000a3/photo/k.jpg', 'image/jpeg', 'd1000000-0000-0000-0000-000000000003');

create function pg_temp.as_user(p_user uuid, p_tenant uuid, p_role text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'tenant_id', p_tenant,
    'app_role', p_role, 'role', 'authenticated')::text, true) $$;

---------------------------------------------------------------- staff on the job
select pg_temp.as_user('d1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-00000000000a', 'worker');
set local role authenticated;
select lives_ok($$ insert into public.xw_entries (id, tenant_id, job_id, what, why, hours, materials)
  values ('d1000000-0000-0000-0000-0000000000e1', 'd1000000-0000-0000-0000-00000000000a', 'd1000000-0000-0000-0000-0000000000a1',
          'Replaced a rotten joist under the bath', 'Floor was soft', 2, 'Timber, screws') $$,
  'staff on the job log extra work');
select throws_ok($$ insert into public.xw_entries (tenant_id, job_id, what, hours)
  values ('d1000000-0000-0000-0000-00000000000a', 'd1000000-0000-0000-0000-0000000000a1', 'Too long', 30) $$,
  '23514', null, 'more than 24 hours on one entry is refused');
select throws_ok($$ insert into public.xw_entries (tenant_id, job_id, what)
  values ('d1000000-0000-0000-0000-00000000000a', 'd1000000-0000-0000-0000-0000000000a2', 'After the job closed') $$,
  '42501', null, 'staff cannot log extra work on a completed job');
select throws_ok($$ insert into public.xw_entry_files (tenant_id, entry_id, file_id)
  values ('d1000000-0000-0000-0000-00000000000a', 'd1000000-0000-0000-0000-0000000000e1', 'd1000000-0000-0000-0000-0000000000f3') $$,
  '23514', null, 'a photo from another job cannot be attached');
select throws_ok($$ select public.xw_set_invoiced('d1000000-0000-0000-0000-0000000000e1', true) $$,
  '42501', null, 'staff cannot mark extra work as added to an invoice');
reset role;

---------------------------------------------------------------- staff not on the job
select pg_temp.as_user('d1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-00000000000a', 'worker');
set local role authenticated;
select is((select count(*)::int from public.xw_entries), 0, 'staff not on the job cannot see its extra work');
reset role;

---------------------------------------------------------------- owner ticks it off
select pg_temp.as_user('d1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-00000000000a', 'owner');
set local role authenticated;
select is((select open_count from public.xw_open_counts() where job_id = 'd1000000-0000-0000-0000-0000000000a1'), 1,
  'the owner sees one entry not yet on an invoice');
select lives_ok($$ select public.xw_set_invoiced('d1000000-0000-0000-0000-0000000000e1', true) $$, 'the owner marks it added to an invoice');
select is((select count(*)::int from public.xw_open_counts()), 0, '… and it no longer counts as open');
reset role;

select pg_temp.as_user('d1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-00000000000a', 'worker');
set local role authenticated;
update public.xw_entries set what = 'Changed later' where id = 'd1000000-0000-0000-0000-0000000000e1';
delete from public.xw_entries where id = 'd1000000-0000-0000-0000-0000000000e1';
select is((select what from public.xw_entries where id = 'd1000000-0000-0000-0000-0000000000e1'), 'Replaced a rotten joist under the bath',
  'once on an invoice, staff cannot change or remove it');
select throws_ok($$ update public.xw_entries set invoiced_at = null, invoiced_by = null where id = 'd1000000-0000-0000-0000-0000000000e1' $$,
  '42501', null, 'staff cannot clear the invoice mark directly');
reset role;

select pg_temp.as_user('d1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-00000000000a', 'owner');
set local role authenticated;
select lives_ok($$ select public.xw_set_invoiced('d1000000-0000-0000-0000-0000000000e1', false) $$, 'the owner can undo the invoice mark');
select is((select invoiced_by from public.xw_entries where id = 'd1000000-0000-0000-0000-0000000000e1'), null, '… which clears who marked it');
reset role;

---------------------------------------------------------------- other businesses and the switch
select pg_temp.as_user('d2000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-00000000000a', 'owner');
set local role authenticated;
select is((select count(*)::int from public.xw_entries), 0, 'another business sees no extra work');
reset role;

select pg_temp.as_user('d3000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-00000000000a', 'owner');
set local role authenticated;
select throws_ok($$ insert into public.xw_entries (tenant_id, job_id, what)
  values ('d3000000-0000-0000-0000-00000000000a', 'd3000000-0000-0000-0000-0000000000a1', 'Cleared a downpipe') $$,
  '42501', null, 'without extra_work switched on, nobody can log it');
reset role;

select * from finish();
rollback;
