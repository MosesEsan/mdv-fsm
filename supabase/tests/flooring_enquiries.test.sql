-- Flooring enquiries: one-step create, progress stages, owner/manager only.
begin;
select plan(11);

insert into auth.users (id, email) values
  ('a5000000-0000-0000-0000-000000000001', 'owner@en.test'),
  ('a5000000-0000-0000-0000-000000000002', 'fitter@en.test');
insert into public.tenants (id, name, features) values
  ('a5000000-0000-0000-0000-00000000000a', 'Floors EN', '{"flooring": true, "scheduling": true}');
insert into public.profiles (id, tenant_id, full_name, role) values
  ('a5000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-00000000000a', 'Owner', 'owner'),
  ('a5000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-00000000000a', 'Fitter', 'fitter');
insert into public.customers (id, tenant_id, name, phone, address) values
  ('a5000000-0000-0000-0000-0000000000c1', 'a5000000-0000-0000-0000-00000000000a', 'Existing Customer', '01 555', '9 Old Road');

create temp table r (name text primary key, v jsonb);
grant all on r to authenticated;
create function pg_temp.as_user(p_user uuid, p_role text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'tenant_id', 'a5000000-0000-0000-0000-00000000000a',
    'app_role', p_role, 'role', 'authenticated')::text, true) $$;
create function pg_temp.job(p_name text) returns uuid language sql as $$ select (v ->> 'job_id')::uuid from r where name = p_name $$;
create function pg_temp.stage(p_name text) returns text language sql as $$
  select stage from public.fl_v_enquiries where job_id = pg_temp.job(p_name) $$;

select pg_temp.as_user('a5000000-0000-0000-0000-000000000001', 'owner');
set local role authenticated;

insert into r select 'new', public.fl_create_enquiry(null, '{"name": "Mary Byrne", "phone": "087 111 2222", "address": "1 Main St"}',
  'Oak floor in kitchen', null, 'website', 'Wants it before Christmas', '2026-11-04 10:00+00');
select is((select customer_name || '|' || site_address || '|' || source from public.fl_v_enquiries where job_id = pg_temp.job('new')),
  'Mary Byrne|1 Main St|website', 'a new enquiry adds the customer and the job, using their address for the site');
select is(pg_temp.stage('new'), 'viewing_booked', 'with a viewing time it shows as viewing booked');

insert into r select 'existing', public.fl_create_enquiry('a5000000-0000-0000-0000-0000000000c1', null, 'Stairs carpet', '22 New Road', 'phone', null);
select is((select site_address from public.jobs where id = pg_temp.job('existing')), '22 New Road', 'an existing customer can have a different site address');
select is(pg_temp.stage('existing'), 'new', 'without a viewing it is new');

select throws_ok($$ select public.fl_create_enquiry(null, '{"name": "No Contact"}', 'Hall', null, 'phone', null) $$,
  '22023', null, 'a new customer needs a phone or an email');
select throws_ok($$ select public.fl_create_enquiry('a5000000-0000-0000-0000-0000000000c1', null, '  ', null, 'phone', null) $$,
  '22023', null, 'the enquiry must say what they want');

insert into public.fl_viewing_rooms (tenant_id, viewing_id, name, area_m2)
select 'a5000000-0000-0000-0000-00000000000a', v.id, 'Kitchen', 12 from public.fl_viewings v where v.job_id = pg_temp.job('new');
select is(pg_temp.stage('new'), 'measured', 'once rooms are measured it shows as measured');

select public.save_booking(null, pg_temp.job('new'), '2026-11-10 08:00+00', '2026-11-10 16:00+00', array['a5000000-0000-0000-0000-000000000002']::uuid[]);
select is(pg_temp.stage('new'), 'booked', 'once the work is in the diary it shows as booked');

update public.fl_enquiries set status = 'lost', lost_reason = 'Went with someone else' where job_id = pg_temp.job('existing');
select is(pg_temp.stage('existing'), 'lost', 'an enquiry can be marked as not going ahead');
select throws_ok($$ update public.fl_enquiries set lost_reason = 'x' where job_id = pg_temp.job('new') $$,
  '23514', null, 'a reason only goes with a lost enquiry');
reset role;

select pg_temp.as_user('a5000000-0000-0000-0000-000000000002', 'fitter');
set local role authenticated;
select is((select count(*)::int from public.fl_v_enquiries), 0, 'fitters see no enquiries');
reset role;

select * from finish();
rollback;
