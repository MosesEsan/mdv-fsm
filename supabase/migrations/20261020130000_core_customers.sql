-- Core: customers, tightened. A customer belongs to one business; jobs can only point at a
-- customer of the same business; owners and managers see and edit customers (staff get only
-- name, phone and address of their booked jobs through booking_job_sheet).

alter table public.customers
  add column if not exists notes text check (length(notes) <= 2000),
  add column if not exists updated_at timestamptz not null default now(),
  add constraint customers_name_length check (length(btrim(name)) between 1 and 120),
  add constraint customers_phone_length check (phone is null or length(phone) <= 40),
  add constraint customers_email_shape check (email is null or (length(email) <= 254 and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$')),
  add constraint customers_address_length check (address is null or length(address) <= 500);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'customers_tenant_id_id_key') then
    alter table public.customers add constraint customers_tenant_id_id_key unique (tenant_id, id);
  end if;
end $$;

-- Replace the plain customer link on jobs with a same-business link.
do $$
declare c text;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.jobs'::regclass and contype = 'f'
              and conkey = array[(select attnum from pg_attribute where attrelid = 'public.jobs'::regclass and attname = 'customer_id')]::smallint[]
  loop
    execute format('alter table public.jobs drop constraint %I', c);
  end loop;
end $$;
alter table public.jobs
  add constraint jobs_customer_fk foreign key (tenant_id, customer_id) references public.customers (tenant_id, id);
create index if not exists jobs_customer_idx on public.jobs (tenant_id, customer_id);

-- Search by name, phone or email within a business.
create index if not exists customers_tenant_name_idx on public.customers (tenant_id, lower(name));

create or replace function private.customers_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.name := btrim(new.name);
  new.email := nullif(lower(btrim(new.email)), '');
  new.phone := nullif(btrim(new.phone), '');
  new.address := nullif(btrim(new.address), '');
  return new;
end
$$;
drop trigger if exists customers_touch on public.customers;
create trigger customers_touch before insert or update on public.customers
for each row execute function private.customers_touch();
