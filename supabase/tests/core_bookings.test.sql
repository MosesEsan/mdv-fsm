-- Bookings: no double-booking, staff see only their own bookings and job sheets, no cross-business access.
begin;
select plan(22);

insert into auth.users (id, email) values
  ('a2000000-0000-0000-0000-000000000001', 'owner@bk.test'),
  ('a2000000-0000-0000-0000-000000000002', 'fitter1@bk.test'),
  ('a2000000-0000-0000-0000-000000000003', 'fitter2@bk.test'),
  ('b2000000-0000-0000-0000-000000000001', 'owner-b@bk.test');
insert into public.tenants (id, name, timezone, features) values
  ('a2000000-0000-0000-0000-00000000000a', 'Floors A', 'Europe/Dublin', '{"scheduling": true}'),
  ('b2000000-0000-0000-0000-00000000000b', 'Floors B', 'Europe/Dublin', '{"scheduling": true}');
insert into public.profiles (id, tenant_id, full_name, role) values
  ('a2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-00000000000a', 'Owner A', 'owner'),
  ('a2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-00000000000a', 'Fitter One', 'fitter'),
  ('a2000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-00000000000a', 'Fitter Two', 'fitter'),
  ('b2000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-00000000000b', 'Owner B', 'owner');
insert into public.customers (id, tenant_id, name, phone, address) values
  ('a2000000-0000-0000-0000-0000000000c1', 'a2000000-0000-0000-0000-00000000000a', 'Mary Byrne', '087 000 0000', '1 Main St');
insert into public.jobs (id, tenant_id, customer_id, summary, site_address) values
  ('a2000000-0000-0000-0000-0000000000a1', 'a2000000-0000-0000-0000-00000000000a', 'a2000000-0000-0000-0000-0000000000c1', 'Oak floor, kitchen', '1 Main St'),
  ('a2000000-0000-0000-0000-0000000000a2', 'a2000000-0000-0000-0000-00000000000a', null, 'Carpet, stairs', '5 High St');

create temp table ids (name text primary key, id uuid);
grant all on ids to authenticated;

create function pg_temp.as_user(p_user uuid, p_tenant uuid, p_role text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'tenant_id', p_tenant, 'app_role', p_role, 'role', 'authenticated')::text, true) $$;
create function pg_temp.bid(p_name text) returns uuid language sql as $$ select id from ids where name = p_name $$;

---------------------------------------------------------------- owner books and the database stops clashes
select pg_temp.as_user('a2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-00000000000a', 'owner');
set local role authenticated;

insert into ids select 'b1', (public.save_booking(null, 'a2000000-0000-0000-0000-0000000000a1', '2026-11-02 09:00+00', '2026-11-02 13:00+00',
  array['a2000000-0000-0000-0000-000000000002']::uuid[], 'Bring the long ruler')).id;
select is((select count(*)::int from public.booking_assignees where booking_id = pg_temp.bid('b1')), 1, 'owner books a job for a fitter');
select is((select count(*)::int from public.booking_clashes(array['a2000000-0000-0000-0000-000000000002']::uuid[], '2026-11-02 12:00+00', '2026-11-02 15:00+00')),
  1, 'clash check finds the overlap');
select is((select count(*)::int from public.booking_clashes(array['a2000000-0000-0000-0000-000000000002']::uuid[], '2026-11-02 13:00+00', '2026-11-02 15:00+00')),
  0, 'back-to-back bookings do not clash');
select throws_like($$ select public.save_booking(null, 'a2000000-0000-0000-0000-0000000000a2', '2026-11-02 12:00+00', '2026-11-02 15:00+00',
  array['a2000000-0000-0000-0000-000000000002']::uuid[]) $$, 'Fitter One is already booked%', 'double-booking refused with a message naming the person');
select throws_ok($$ select public.save_booking(null, 'a2000000-0000-0000-0000-0000000000a2', '2026-11-02 15:00+00', '2026-11-02 14:00+00', '{}') $$,
  '22023', null, 'finish before start refused');

insert into ids select 'b2', (public.save_booking(null, 'a2000000-0000-0000-0000-0000000000a2', '2026-11-02 14:00+00', '2026-11-02 17:00+00',
  array['a2000000-0000-0000-0000-000000000003']::uuid[])).id;
select lives_ok($$ insert into public.booking_assignees (tenant_id, booking_id, user_id, time_range)
  values ('a2000000-0000-0000-0000-00000000000a', pg_temp.bid('b2'), 'a2000000-0000-0000-0000-000000000002', '[2020-01-01,2020-01-02)') $$,
  'adding a second fitter directly works when they are free');
select is((select lower(time_range) from public.booking_assignees where booking_id = pg_temp.bid('b2') and user_id = 'a2000000-0000-0000-0000-000000000002'),
  '2026-11-02 14:00+00'::timestamptz, 'the time range comes from the booking, not from the client');
select throws_ok($$ update public.bookings set starts_at = '2026-11-02 12:00+00' where id = pg_temp.bid('b2') $$,
  '23P01', null, 'moving a booking onto someone''s other booking is blocked by the database');
select throws_like($$ select public.save_booking(pg_temp.bid('b2'), 'a2000000-0000-0000-0000-0000000000a2', '2026-11-02 12:00+00', '2026-11-02 17:00+00',
  array['a2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000003']::uuid[]) $$, 'Fitter One is already booked%', 'moving through save_booking gives the friendly message');

select lives_ok($$ select public.cancel_booking(pg_temp.bid('b1')) $$, 'owner cancels a booking');
select lives_ok($$ insert into ids select 'b3', (public.save_booking(null, 'a2000000-0000-0000-0000-0000000000a1', '2026-11-02 10:00+00', '2026-11-02 12:00+00',
  array['a2000000-0000-0000-0000-000000000002']::uuid[])).id $$, 'a cancelled booking frees the time');
select throws_like($$ select public.save_booking(pg_temp.bid('b1'), 'a2000000-0000-0000-0000-0000000000a1', '2026-11-02 09:00+00', '2026-11-02 13:00+00',
  array['a2000000-0000-0000-0000-000000000002']::uuid[]) $$, 'Fitter One is already booked%', 'bringing a cancelled booking back is checked for clashes');
reset role;

---------------------------------------------------------------- fitters
select pg_temp.as_user('a2000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-00000000000a', 'fitter');
set local role authenticated;
select is((select array_agg(id) from public.bookings), array[pg_temp.bid('b2')], 'a fitter sees only bookings they are on');
select is((select count(*)::int from public.booking_assignees), 2, 'a fitter sees who else is on their booking');
select is((select job_summary from public.booking_job_sheet(pg_temp.bid('b2'))), 'Carpet, stairs', 'a fitter opens the job sheet for their booking');
select throws_ok($$ select * from public.booking_job_sheet(pg_temp.bid('b1')) $$, '42501', null, 'a fitter cannot open someone else''s job sheet');
select throws_ok($$ select public.save_booking(null, 'a2000000-0000-0000-0000-0000000000a2', '2026-11-05 09:00+00', '2026-11-05 10:00+00', '{}') $$,
  '42501', null, 'a fitter cannot change the schedule');
select throws_ok($$ insert into public.bookings (tenant_id, job_id, starts_at, ends_at)
  values ('a2000000-0000-0000-0000-00000000000a', 'a2000000-0000-0000-0000-0000000000a2', '2026-11-05 09:00+00', '2026-11-05 10:00+00') $$,
  '42501', null, 'a fitter cannot insert bookings directly');
reset role;

select pg_temp.as_user('a2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-00000000000a', 'fitter');
set local role authenticated;
select is((select customer_phone from public.booking_job_sheet(pg_temp.bid('b3'))), '087 000 0000', 'the job sheet has the customer''s phone and address');
select is((select count(*)::int from public.customers), 0, 'but fitters still cannot read the customer list');
reset role;

---------------------------------------------------------------- other businesses, feature off
select pg_temp.as_user('b2000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-00000000000b', 'owner');
set local role authenticated;
select is((select count(*)::int from public.bookings), 0, 'another business sees none of these bookings');
reset role;

update public.tenants set features = '{}' where id = 'a2000000-0000-0000-0000-00000000000a';
select pg_temp.as_user('a2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-00000000000a', 'owner');
set local role authenticated;
select is((select count(*)::int from public.bookings), 0, 'with scheduling switched off, bookings are hidden');
reset role;

select * from finish();
rollback;
