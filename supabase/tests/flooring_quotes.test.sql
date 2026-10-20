-- Flooring quotes: owner only, totals in the database, sent quotes locked, stage "quoted" visible without amounts.
begin;
select plan(15);

insert into auth.users (id, email) values
  ('a6000000-0000-0000-0000-000000000001', 'owner@qt.test'),
  ('a6000000-0000-0000-0000-000000000002', 'manager@qt.test'),
  ('a6000000-0000-0000-0000-000000000003', 'fitter@qt.test');
insert into public.tenants (id, name, features) values
  ('a6000000-0000-0000-0000-00000000000a', 'Floors QT', '{"flooring": true, "scheduling": true}');
insert into public.profiles (id, tenant_id, full_name, role) values
  ('a6000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-00000000000a', 'Owner', 'owner'),
  ('a6000000-0000-0000-0000-000000000002', 'a6000000-0000-0000-0000-00000000000a', 'Manager', 'manager'),
  ('a6000000-0000-0000-0000-000000000003', 'a6000000-0000-0000-0000-00000000000a', 'Fitter', 'fitter');

create temp table ids (name text primary key, id uuid);
grant all on ids to authenticated;
create function pg_temp.as_user(p_user uuid, p_role text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'tenant_id', 'a6000000-0000-0000-0000-00000000000a',
    'app_role', p_role, 'role', 'authenticated')::text, true) $$;
create function pg_temp.id(p text) returns uuid language sql as $$ select id from ids where name = p $$;

select pg_temp.as_user('a6000000-0000-0000-0000-000000000001', 'owner');
set local role authenticated;
insert into ids select 'job', (public.fl_create_enquiry(null, '{"name": "Mary", "phone": "087"}', 'Oak floor', '1 Main St', 'phone', null) ->> 'job_id')::uuid;
insert into public.fl_price_items (tenant_id, kind, name, unit, unit_price) values
  ('a6000000-0000-0000-0000-00000000000a', 'floor', 'Engineered oak', 'm2', 45.50);

insert into ids select 'q1', public.fl_save_quote(null, pg_temp.id('job'), 13.5, '2026-11-30', 'Includes furniture moving',
  '[{"description": "Kitchen – engineered oak", "quantity": 14.7, "unit": "m2", "unit_price": 45.50},
    {"description": "Door bars", "quantity": 2, "unit": "item", "unit_price": 12}]');
select is((select subtotal || '|' || vat_amount || '|' || total from public.fl_v_quotes where id = pg_temp.id('q1')),
  '692.85|93.53|786.38', 'totals are worked out in the database (14.7 × 45.50 + 2 × 12, plus 13.5% VAT)');
select is((select number from public.fl_quotes where id = pg_temp.id('q1')), 1, 'quotes are numbered from 1 per business');
select throws_ok($$ select public.fl_save_quote(null, pg_temp.id('job'), null, null, null, '[]') $$, '22023', null, 'a quote needs at least one line');

update public.fl_quotes set status = 'sent' where id = pg_temp.id('q1');
select isnt((select sent_at from public.fl_quotes where id = pg_temp.id('q1')), null, 'sending records when');
select throws_ok($$ select public.fl_save_quote(pg_temp.id('q1'), pg_temp.id('job'), 0, null, null, '[{"description": "x", "quantity": 1, "unit_price": 1}]') $$,
  '22023', null, 'a sent quote cannot be changed');
select throws_ok($$ delete from public.fl_quote_lines where quote_id = pg_temp.id('q1') $$, '22023', null, '… nor its lines removed');
insert into ids select 'q2', public.fl_copy_quote(pg_temp.id('q1'));
select is((select number || '|' || status || '|' || total from public.fl_v_quotes where id = pg_temp.id('q2')), '2|draft|786.38',
  'a new version copies the lines into a new draft');
reset role;

---------------------------------------------------------------- manager and fitter
select pg_temp.as_user('a6000000-0000-0000-0000-000000000002', 'manager');
set local role authenticated;
select is((select count(*)::int from public.fl_quotes), 0, 'a manager cannot see quotes');
select is((select count(*)::int from public.fl_v_quotes), 0, '… nor the totals');
select is((select count(*)::int from public.fl_price_items), 0, '… nor the price list');
select is((select stage from public.fl_v_enquiries where job_id = pg_temp.id('job')), 'quoted', '… but sees that the enquiry was quoted');
select throws_ok($$ select public.fl_save_quote(null, pg_temp.id('job'), null, null, null, '[{"description": "x", "quantity": 1, "unit_price": 1}]') $$,
  '42501', null, 'a manager cannot make a quote');
reset role;

select pg_temp.as_user('a6000000-0000-0000-0000-000000000003', 'fitter');
set local role authenticated;
select is((select count(*)::int from public.fl_quote_lines), 0, 'a fitter cannot see any quote lines');
select is((select count(*)::int from public.fl_price_items), 0, '… nor prices');
reset role;

update public.tenants set features = '{"scheduling": true}' where id = 'a6000000-0000-0000-0000-00000000000a';
select pg_temp.as_user('a6000000-0000-0000-0000-000000000001', 'owner');
set local role authenticated;
select is((select count(*)::int from public.fl_quotes), 0, 'with flooring off, quotes are hidden even from the owner');
reset role;

select * from finish();
rollback;
