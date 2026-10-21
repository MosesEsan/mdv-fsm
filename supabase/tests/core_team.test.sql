-- Team: only the owner sees the team (with emails), adds people and changes their role or access.
-- Owners can't make owners, change themselves or touch other owners, and never reach another business.
begin;
select plan(14);

insert into auth.users (id, email, last_sign_in_at) values
  ('d1000000-0000-0000-0000-000000000001', 'owner@team.test', now()),
  ('d1000000-0000-0000-0000-000000000002', 'manager@team.test', now()),
  ('d1000000-0000-0000-0000-000000000003', 'worker@team.test', null),
  ('d1000000-0000-0000-0000-000000000004', 'new@team.test', null),
  ('d1000000-0000-0000-0000-000000000005', 'new2@team.test', null),
  ('d2000000-0000-0000-0000-000000000001', 'owner@other.test', now()),
  ('d2000000-0000-0000-0000-000000000002', 'worker@other.test', now());
insert into public.tenants (id, name) values
  ('d1000000-0000-0000-0000-00000000000a', 'Team Co'),
  ('d2000000-0000-0000-0000-00000000000a', 'Other Co');
insert into public.profiles (id, tenant_id, full_name, role) values
  ('d1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-00000000000a', 'Owner', 'owner'),
  ('d1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-00000000000a', 'Manager', 'manager'),
  ('d1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-00000000000a', 'Worker', 'worker'),
  ('d2000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-00000000000a', 'Other Owner', 'owner'),
  ('d2000000-0000-0000-0000-000000000002', 'd2000000-0000-0000-0000-00000000000a', 'Other Worker', 'worker');

create function pg_temp.as_user(p_user uuid, p_tenant uuid, p_role text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'tenant_id', p_tenant,
    'app_role', p_role, 'role', 'authenticated')::text, true) $$;

-------------------------------------------------- owner
select pg_temp.as_user('d1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-00000000000a', 'owner');
set local role authenticated;
select is((select count(*)::int from public.team_members()), 3, 'owner sees their own team only');
select is((select email from public.team_members() where role = 'worker'), 'worker@team.test', 'with emails');
select is((select signed_in from public.team_members() where role = 'worker'), false, 'and whether they have signed in');
select lives_ok($$ select public.team_add_member('d1000000-0000-0000-0000-000000000004', ' Adam ', 'worker') $$, 'owner adds a worker');
select is((select tenant_id from public.profiles where id = 'd1000000-0000-0000-0000-000000000004'),
  'd1000000-0000-0000-0000-00000000000a'::uuid, 'into their own business');
select throws_ok($$ select public.team_add_member('d1000000-0000-0000-0000-000000000005', 'Boss', 'owner') $$, '22023', null, 'cannot add an owner');
select throws_ok($$ select public.team_add_member('d2000000-0000-0000-0000-000000000002', 'Steal', 'worker') $$, '23505', null, 'cannot take someone from another business');
select lives_ok($$ select public.team_update_member('d1000000-0000-0000-0000-000000000003', 'Worker', 'manager', false) $$, 'owner promotes and switches off a worker');
select is((select role || ':' || active from public.profiles where id = 'd1000000-0000-0000-0000-000000000003'), 'manager:false', 'change saved');
select throws_ok($$ select public.team_update_member('d1000000-0000-0000-0000-000000000001', 'Owner', 'manager', true) $$, '42501', null, 'cannot change themselves');
select throws_ok($$ select public.team_update_member('d2000000-0000-0000-0000-000000000002', 'X', 'manager', false) $$, 'P0002', null, 'cannot touch another business');
select is((select count(*)::int from public.team_log), 2, 'adds and changes are logged');

-------------------------------------------------- manager
reset role;
select pg_temp.as_user('d1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-00000000000a', 'manager');
set local role authenticated;
select throws_ok($$ select * from public.team_members() $$, '42501', null, 'a manager cannot see the team list');
select throws_ok($$ select public.team_add_member('d1000000-0000-0000-0000-000000000005', 'X', 'worker') $$, '42501', null, 'or add people');

select * from finish();
rollback;
