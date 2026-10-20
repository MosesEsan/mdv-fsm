-- Customers: owners and managers only; jobs can't point at another business's customer; tidy data.
begin;
select plan(7);

insert into auth.users (id, email) values
  ('a4000000-0000-0000-0000-000000000001', 'owner@cu.test'),
  ('a4000000-0000-0000-0000-000000000002', 'fitter@cu.test');
insert into public.tenants (id, name) values
  ('a4000000-0000-0000-0000-00000000000a', 'Cust A'),
  ('b4000000-0000-0000-0000-00000000000b', 'Cust B');
insert into public.profiles (id, tenant_id, full_name, role) values
  ('a4000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-00000000000a', 'Owner', 'owner'),
  ('a4000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-00000000000a', 'Fitter', 'fitter');
insert into public.customers (id, tenant_id, name) values
  ('b4000000-0000-0000-0000-0000000000c1', 'b4000000-0000-0000-0000-00000000000b', 'Other business customer');

create function pg_temp.as_user(p_user uuid, p_role text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'tenant_id', 'a4000000-0000-0000-0000-00000000000a',
    'app_role', p_role, 'role', 'authenticated')::text, true) $$;

select pg_temp.as_user('a4000000-0000-0000-0000-000000000001', 'owner');
set local role authenticated;
insert into public.customers (id, tenant_id, name, email, phone)
values ('a4000000-0000-0000-0000-0000000000c1', 'a4000000-0000-0000-0000-00000000000a', '  Mary Byrne ', ' Mary@Example.IE ', ' 087 123 4567 ');
select is((select name || '|' || email || '|' || phone from public.customers where id = 'a4000000-0000-0000-0000-0000000000c1'),
  'Mary Byrne|mary@example.ie|087 123 4567', 'names, emails and phones are tidied');
select throws_ok($$ insert into public.customers (tenant_id, name, email) values ('a4000000-0000-0000-0000-00000000000a', 'X', 'not-an-email') $$,
  '23514', null, 'a broken email is refused');
select throws_ok($$ insert into public.customers (tenant_id, name) values ('a4000000-0000-0000-0000-00000000000a', '   ') $$,
  '23514', null, 'a customer needs a name');
select lives_ok($$ insert into public.jobs (tenant_id, customer_id, summary) values ('a4000000-0000-0000-0000-00000000000a', 'a4000000-0000-0000-0000-0000000000c1', 'Hall') $$,
  'a job links to a customer of the same business');
select throws_ok($$ insert into public.jobs (tenant_id, customer_id, summary) values ('a4000000-0000-0000-0000-00000000000a', 'b4000000-0000-0000-0000-0000000000c1', 'Sneaky') $$,
  '23503', null, 'a job cannot link to another business''s customer');
select is((select count(*)::int from public.customers), 1, 'the owner sees only their own customers');
reset role;

select pg_temp.as_user('a4000000-0000-0000-0000-000000000002', 'fitter');
set local role authenticated;
select is((select count(*)::int from public.customers), 0, 'fitters cannot read the customer list');
reset role;

select * from finish();
rollback;
