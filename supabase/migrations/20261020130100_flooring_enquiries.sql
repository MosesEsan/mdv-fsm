-- Flooring module: enquiries. An enquiry is the first contact about a job: who, what they want,
-- how they got in touch, and (optionally) when the viewing is. Owner / manager only.
-- The customer and the job are core rows; this table adds the enquiry details.

create table public.fl_enquiries (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants (id),
  job_id       uuid not null,
  source       text not null default 'phone'
               check (source in ('phone', 'email', 'website', 'walk_in', 'referral', 'social', 'other')),
  received_at  timestamptz not null default now(),
  details      text check (length(details) <= 4000),
  status       text not null default 'open' check (status in ('open', 'lost')),
  lost_reason  text check (length(lost_reason) <= 500),
  created_by   uuid not null default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint fl_enquiries_tenant_id_id_key unique (tenant_id, id),
  constraint fl_enquiries_one_per_job unique (tenant_id, job_id),
  constraint fl_enquiries_job_fk foreign key (tenant_id, job_id) references public.jobs (tenant_id, id) on delete cascade,
  constraint fl_enquiries_lost_reason check (status = 'lost' or lost_reason is null)
);
create index fl_enquiries_tenant_status_idx on public.fl_enquiries (tenant_id, status, received_at desc);

create trigger fl_enquiries_touch before update on public.fl_enquiries
for each row execute function private.fl_touch();

alter table public.fl_enquiries enable row level security;
create policy fl_enquiries_manager_all on public.fl_enquiries for all
  using (tenant_id = (select private.current_tenant_id()) and (select private.is_manager())
         and (select private.feature_enabled('flooring')))
  with check (tenant_id = (select private.current_tenant_id()) and (select private.is_manager())
              and (select private.feature_enabled('flooring')));
grant select, insert, update, delete on public.fl_enquiries to authenticated;

---------------------------------------------------------------- one-step create
-- New enquiry: picks an existing customer or adds one, creates the job, the enquiry and,
-- when a viewing time is given, the viewing. All or nothing. Runs with the caller's rights.
create or replace function public.fl_create_enquiry(
  p_customer_id uuid,
  p_customer jsonb,
  p_summary text,
  p_site_address text,
  p_source text,
  p_details text,
  p_viewing_at timestamptz default null)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_tenant   uuid := private.current_tenant_id();
  v_customer uuid := p_customer_id;
  v_address  text;
  v_job      uuid;
  v_enquiry  uuid;
begin
  if not private.is_manager() or not private.feature_enabled('flooring') then
    raise exception 'Only the owner or a manager can log enquiries' using errcode = '42501';
  end if;
  if nullif(btrim(p_summary), '') is null then
    raise exception 'Say what the customer is looking for' using errcode = '22023';
  end if;

  if v_customer is null then
    if p_customer is null or nullif(btrim(p_customer ->> 'name'), '') is null then
      raise exception 'Pick a customer or enter a new one' using errcode = '22023';
    end if;
    if nullif(btrim(p_customer ->> 'phone'), '') is null and nullif(btrim(p_customer ->> 'email'), '') is null then
      raise exception 'Add a phone number or an email for the customer' using errcode = '22023';
    end if;
    insert into public.customers (tenant_id, name, phone, email, address, notes)
    values (v_tenant, p_customer ->> 'name', p_customer ->> 'phone', p_customer ->> 'email',
            p_customer ->> 'address', p_customer ->> 'notes')
    returning id into v_customer;
  end if;

  select c.address into v_address from public.customers c where c.id = v_customer and c.tenant_id = v_tenant;
  if not found then
    raise exception 'Customer not found' using errcode = 'P0002';
  end if;

  insert into public.jobs (tenant_id, customer_id, summary, site_address, status)
  values (v_tenant, v_customer, btrim(p_summary), coalesce(nullif(btrim(p_site_address), ''), v_address), 'enquiry')
  returning id into v_job;

  insert into public.fl_enquiries (tenant_id, job_id, source, details)
  values (v_tenant, v_job, coalesce(p_source, 'phone'), nullif(btrim(p_details), ''))
  returning id into v_enquiry;

  if p_viewing_at is not null then
    insert into public.fl_viewings (tenant_id, job_id, viewed_at) values (v_tenant, v_job, p_viewing_at);
  end if;

  return jsonb_build_object('job_id', v_job, 'enquiry_id', v_enquiry, 'customer_id', v_customer);
end
$$;
revoke all on function public.fl_create_enquiry(uuid, jsonb, text, text, text, text, timestamptz) from public, anon;
grant execute on function public.fl_create_enquiry(uuid, jsonb, text, text, text, text, timestamptz) to authenticated;

---------------------------------------------------------------- list with progress
-- One row per enquiry with the customer, the viewing and where it has got to.
-- security_invoker: the caller's RLS applies (owner / manager only).
create or replace view public.fl_v_enquiries
with (security_invoker = true) as
select
  e.id            as enquiry_id,
  e.tenant_id,
  e.job_id,
  e.source,
  e.received_at,
  e.details,
  e.status,
  e.lost_reason,
  j.summary       as job_summary,
  j.site_address,
  c.id            as customer_id,
  c.name          as customer_name,
  c.phone         as customer_phone,
  c.email         as customer_email,
  v.viewed_at,
  coalesce((select count(*) from public.fl_viewing_rooms r where r.viewing_id = v.id), 0)::int as room_count,
  (select min(b.starts_at) from public.bookings b
    where b.job_id = e.job_id and b.tenant_id = e.tenant_id and b.status = 'scheduled') as next_booking_at,
  case
    when e.status = 'lost' then 'lost'
    when exists (select 1 from public.bookings b
                  where b.job_id = e.job_id and b.tenant_id = e.tenant_id and b.status = 'scheduled') then 'booked'
    when exists (select 1 from public.fl_viewing_rooms r where r.viewing_id = v.id) then 'measured'
    when v.viewed_at is not null then 'viewing_booked'
    else 'new'
  end as stage
from public.fl_enquiries e
join public.jobs j on j.id = e.job_id and j.tenant_id = e.tenant_id
left join public.customers c on c.id = j.customer_id and c.tenant_id = j.tenant_id
left join public.fl_viewings v on v.job_id = e.job_id and v.tenant_id = e.tenant_id;

grant select on public.fl_v_enquiries to authenticated;
