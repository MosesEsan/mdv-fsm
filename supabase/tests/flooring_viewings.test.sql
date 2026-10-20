-- Flooring viewings: rooms and areas; booked fitters can read the viewing but not change it; others see nothing.
begin;
select plan(8);

insert into auth.users (id, email) values
  ('a3000000-0000-0000-0000-000000000001', 'owner@jf.test'),
  ('a3000000-0000-0000-0000-000000000002', 'fitter-on@jf.test'),
  ('a3000000-0000-0000-0000-000000000003', 'fitter-off@jf.test'),
  ('a3000000-0000-0000-0000-000000000004', 'manager@jf.test');
insert into public.tenants (id, name, features) values
  ('a3000000-0000-0000-0000-00000000000a', 'Floors JF', '{"scheduling": true, "flooring": true}');
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

---------------------------------------------------------------- owner
select pg_temp.as_user('a3000000-0000-0000-0000-000000000001', 'owner');
set local role authenticated;
insert into public.fl_viewings (id, tenant_id, job_id, notes, est_duration_hours)
values ('a3000000-0000-0000-0000-0000000000f1', 'a3000000-0000-0000-0000-00000000000a', 'a3000000-0000-0000-0000-0000000000a1', 'Uneven subfloor', 6);
insert into public.fl_viewing_rooms (tenant_id, viewing_id, name, length_m, width_m, floor_type)
values ('a3000000-0000-0000-0000-00000000000a', 'a3000000-0000-0000-0000-0000000000f1', 'Kitchen', 4.2, 3.5, 'Engineered oak');
insert into public.fl_viewing_rooms (tenant_id, viewing_id, name, area_m2)
values ('a3000000-0000-0000-0000-00000000000a', 'a3000000-0000-0000-0000-0000000000f1', 'L-shaped hall', 9.4);
select is((select area_m2 from public.fl_viewing_rooms where name = 'Kitchen'), 14.70::numeric, 'area is length x width');
select is((select area_m2 from public.fl_viewing_rooms where name = 'L-shaped hall'), 9.40::numeric, 'odd-shaped rooms keep the area typed in');
select throws_ok($$ insert into public.fl_viewings (tenant_id, job_id) values ('a3000000-0000-0000-0000-00000000000a', 'a3000000-0000-0000-0000-0000000000a1') $$,
  '23505', null, 'one viewing per job');
reset role;

select pg_temp.as_user('a3000000-0000-0000-0000-000000000002', 'fitter');
set local role authenticated;
select is((select count(*)::int from public.fl_viewing_rooms), 2, 'a fitter booked on the job sees the rooms measured');
update public.fl_viewing_rooms set name = 'Changed by fitter' where name = 'Kitchen';
select is((select count(*)::int from public.fl_viewing_rooms where name = 'Kitchen'), 1, '… but cannot change them');
reset role;

select pg_temp.as_user('a3000000-0000-0000-0000-000000000003', 'fitter');
set local role authenticated;
select is((select count(*)::int from public.fl_viewings), 0, 'a fitter not booked on the job sees no viewing');
reset role;

update public.tenants set features = '{"scheduling": true}' where id = 'a3000000-0000-0000-0000-00000000000a';
select pg_temp.as_user('a3000000-0000-0000-0000-000000000001', 'owner');
set local role authenticated;
select is((select count(*)::int from public.fl_viewings), 0, 'with the flooring module off, viewings are hidden');
select throws_ok($$ insert into public.fl_viewing_rooms (tenant_id, viewing_id, name) values ('a3000000-0000-0000-0000-00000000000a', 'a3000000-0000-0000-0000-0000000000f1', 'New') $$,
  '42501', null, '… and cannot be added to');
reset role;

select * from finish();
rollback;
