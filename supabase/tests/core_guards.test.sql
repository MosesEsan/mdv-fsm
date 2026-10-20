-- Core guards: no self-promotion, no self-service feature flags.
begin;
select plan(5);

insert into auth.users (id, email) values
  ('d0000000-0000-0000-0000-000000000001', 'owner@guards.test'),
  ('d0000000-0000-0000-0000-000000000002', 'worker@guards.test');
insert into public.tenants (id, name) values ('d0000000-0000-0000-0000-00000000000a', 'Guards');
insert into public.profiles (id, tenant_id, full_name, role) values
  ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-00000000000a', 'Owner', 'owner'),
  ('d0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-00000000000a', 'Worker', 'worker');

create function pg_temp.act_as(p_user uuid, p_role text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'tenant_id', 'd0000000-0000-0000-0000-00000000000a',
    'app_role', p_role, 'role', 'authenticated')::text, true);
$$;

select pg_temp.act_as('d0000000-0000-0000-0000-000000000002', 'worker');
set local role authenticated;
select throws_ok($$ update public.profiles set role = 'owner' where id = auth.uid() $$, '42501', null, 'worker cannot promote themselves');
select throws_ok($$ update public.profiles set active = false where id = auth.uid() $$, '42501', null, 'worker cannot change their status');
select lives_ok($$ update public.profiles set full_name = 'Worker Renamed', phone = '0871234567' where id = auth.uid() $$, 'worker can edit their own name and phone');
reset role;

select pg_temp.act_as('d0000000-0000-0000-0000-000000000001', 'owner');
set local role authenticated;
select throws_ok($$ update public.tenants set features = '{"timesheets": true}' $$, '42501', null, 'owner cannot switch modules on themselves');
select lives_ok($$ update public.tenants set name = 'Guards Ltd' $$, 'owner can rename the business');
reset role;

select * from finish();
rollback;
