-- Flooring module: quotes. OWNER ONLY: prices never reach managers' or fitters' devices.
--   fl_price_items     the owner's price list (per m², per item, per hour, per metre)
--   fl_quote_profile   what goes on every quote (contact details, VAT number, terms, defaults)
--   fl_quotes          one quote for a job (numbered per business; draft / sent / accepted / declined)
--   fl_quote_lines     its lines; totals are worked out here, not trusted from the app
-- The quote PDF is a core job file with owner_only = true (kind 'quote').

create or replace function private.fl_owner_ok()
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select private.is_owner() and private.feature_enabled('flooring')
$$;

---------------------------------------------------------------- price list
create table public.fl_price_items (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id),
  kind        text not null default 'floor' check (kind in ('floor', 'extra', 'labour')),
  name        text not null check (length(btrim(name)) between 1 and 120),
  unit        text not null default 'm2' check (unit in ('m2', 'item', 'hour', 'metre')),
  unit_price  numeric(10,2) not null check (unit_price >= 0 and unit_price <= 100000),
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  constraint fl_price_items_tenant_id_id_key unique (tenant_id, id)
);
create index fl_price_items_tenant_idx on public.fl_price_items (tenant_id, kind, sort_order);

---------------------------------------------------------------- quote profile
create table public.fl_quote_profile (
  tenant_id         uuid primary key references public.tenants (id),
  phone             text check (length(phone) <= 40),
  email             text check (email is null or email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  address           text check (length(address) <= 500),
  vat_number        text check (length(vat_number) <= 40),
  terms             text check (length(terms) <= 4000),
  default_valid_days integer not null default 30 check (default_valid_days between 1 and 365),
  -- null = no VAT shown on quotes (pending the owner's answer on VAT).
  default_vat_rate  numeric(5,2) check (default_vat_rate between 0 and 30),
  updated_at        timestamptz not null default now()
);

---------------------------------------------------------------- quotes
create table public.fl_quotes (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants (id),
  job_id       uuid not null,
  number       integer not null,
  status       text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined')),
  vat_rate     numeric(5,2) check (vat_rate between 0 and 30),
  valid_until  date,
  notes        text check (length(notes) <= 4000),
  pdf_file_id  uuid,
  sent_at      timestamptz,
  decided_at   timestamptz,
  created_by   uuid not null default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint fl_quotes_tenant_id_id_key unique (tenant_id, id),
  constraint fl_quotes_number_key unique (tenant_id, number),
  constraint fl_quotes_job_fk foreign key (tenant_id, job_id) references public.jobs (tenant_id, id) on delete cascade,
  constraint fl_quotes_pdf_fk foreign key (tenant_id, pdf_file_id) references public.job_files (tenant_id, id) on delete set null (pdf_file_id)
);
create index fl_quotes_job_idx on public.fl_quotes (tenant_id, job_id, created_at desc);

create table public.fl_quote_lines (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants (id),
  quote_id     uuid not null,
  description  text not null check (length(btrim(description)) between 1 and 300),
  quantity     numeric(10,2) not null check (quantity > 0 and quantity <= 100000),
  unit         text not null default 'item' check (unit in ('m2', 'item', 'hour', 'metre')),
  unit_price   numeric(10,2) not null check (unit_price >= 0 and unit_price <= 100000),
  line_total   numeric(12,2) generated always as (round(quantity * unit_price, 2)) stored,
  sort_order   integer not null default 0,
  constraint fl_quote_lines_quote_fk foreign key (tenant_id, quote_id) references public.fl_quotes (tenant_id, id) on delete cascade
);
create index fl_quote_lines_quote_idx on public.fl_quote_lines (tenant_id, quote_id, sort_order);

-- Number quotes 1, 2, 3 … per business.
create or replace function private.fl_quotes_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('fl_quotes:' || new.tenant_id::text, 0));
  select coalesce(max(q.number), 0) + 1 into new.number from public.fl_quotes q where q.tenant_id = new.tenant_id;
  return new;
end
$$;
create trigger fl_quotes_number before insert on public.fl_quotes
for each row execute function private.fl_quotes_number();

create or replace function private.fl_quotes_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.number <> old.number or new.job_id <> old.job_id then
    raise exception 'A quote''s number and job can''t change' using errcode = '22023';
  end if;
  if old.status <> 'draft' and (new.vat_rate, new.valid_until, new.notes) is distinct from (old.vat_rate, old.valid_until, old.notes) then
    raise exception 'This quote has been sent, so it can''t be changed. Make a new version instead.' using errcode = '22023';
  end if;
  if new.status = 'sent' and old.status = 'draft' then new.sent_at := now(); end if;
  if new.status in ('accepted', 'declined') and old.status <> new.status then new.decided_at := now(); end if;
  return new;
end
$$;
create trigger fl_quotes_before_update before update on public.fl_quotes
for each row execute function private.fl_quotes_before_update();

-- Lines can change only while the quote is a draft.
create or replace function private.fl_quote_lines_draft_only()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  select q.status into v_status from public.fl_quotes q where q.id = coalesce(new.quote_id, old.quote_id);
  if v_status is distinct from 'draft' and v_status is not null then
    raise exception 'This quote has been sent, so it can''t be changed. Make a new version instead.' using errcode = '22023';
  end if;
  return coalesce(new, old);
end
$$;
create trigger fl_quote_lines_draft_only before insert or update or delete on public.fl_quote_lines
for each row execute function private.fl_quote_lines_draft_only();

---------------------------------------------------------------- access: owner only
alter table public.fl_price_items enable row level security;
alter table public.fl_quote_profile enable row level security;
alter table public.fl_quotes enable row level security;
alter table public.fl_quote_lines enable row level security;

create policy fl_price_items_owner on public.fl_price_items for all
  using (tenant_id = (select private.current_tenant_id()) and (select private.fl_owner_ok()))
  with check (tenant_id = (select private.current_tenant_id()) and (select private.fl_owner_ok()));
create policy fl_quote_profile_owner on public.fl_quote_profile for all
  using (tenant_id = (select private.current_tenant_id()) and (select private.fl_owner_ok()))
  with check (tenant_id = (select private.current_tenant_id()) and (select private.fl_owner_ok()));
create policy fl_quotes_owner on public.fl_quotes for all
  using (tenant_id = (select private.current_tenant_id()) and (select private.fl_owner_ok()))
  with check (tenant_id = (select private.current_tenant_id()) and (select private.fl_owner_ok()));
create policy fl_quote_lines_owner on public.fl_quote_lines for all
  using (tenant_id = (select private.current_tenant_id()) and (select private.fl_owner_ok()))
  with check (tenant_id = (select private.current_tenant_id()) and (select private.fl_owner_ok()));

grant select, insert, update, delete on public.fl_price_items, public.fl_quote_profile, public.fl_quote_lines to authenticated;
grant select, insert, delete on public.fl_quotes to authenticated;
grant update (status, vat_rate, valid_until, notes, pdf_file_id) on public.fl_quotes to authenticated;

---------------------------------------------------------------- totals
create or replace view public.fl_v_quotes
with (security_invoker = true) as
select
  q.id, q.tenant_id, q.job_id, q.number, q.status, q.vat_rate, q.valid_until, q.notes, q.pdf_file_id,
  q.sent_at, q.decided_at, q.created_at,
  coalesce(s.subtotal, 0)::numeric(12,2) as subtotal,
  round(coalesce(s.subtotal, 0) * coalesce(q.vat_rate, 0) / 100, 2)::numeric(12,2) as vat_amount,
  (coalesce(s.subtotal, 0) + round(coalesce(s.subtotal, 0) * coalesce(q.vat_rate, 0) / 100, 2))::numeric(12,2) as total,
  coalesce(s.line_count, 0)::int as line_count
from public.fl_quotes q
left join lateral (
  select sum(l.line_total) as subtotal, count(*) as line_count
    from public.fl_quote_lines l where l.quote_id = q.id and l.tenant_id = q.tenant_id
) s on true;
grant select on public.fl_v_quotes to authenticated;

---------------------------------------------------------------- save in one step
-- Creates a draft (p_id null) or updates one, replacing all its lines. Owner only (RLS).
create or replace function public.fl_save_quote(
  p_id uuid, p_job_id uuid, p_vat_rate numeric, p_valid_until date, p_notes text, p_lines jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_tenant uuid := private.current_tenant_id();
  v_id uuid := p_id;
  l jsonb;
  i int := 0;
begin
  if not private.fl_owner_ok() then
    raise exception 'Only the owner can make quotes' using errcode = '42501';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'Add at least one line to the quote' using errcode = '22023';
  end if;
  if v_id is null then
    insert into public.fl_quotes (tenant_id, job_id, number, vat_rate, valid_until, notes)
    values (v_tenant, p_job_id, 0, p_vat_rate, p_valid_until, nullif(btrim(p_notes), ''))
    returning id into v_id;
  else
    update public.fl_quotes set vat_rate = p_vat_rate, valid_until = p_valid_until, notes = nullif(btrim(p_notes), '')
     where id = v_id and tenant_id = v_tenant;
    if not found then raise exception 'Quote not found' using errcode = 'P0002'; end if;
    delete from public.fl_quote_lines where quote_id = v_id;
  end if;
  for l in select value from jsonb_array_elements(p_lines) loop
    insert into public.fl_quote_lines (tenant_id, quote_id, description, quantity, unit, unit_price, sort_order)
    values (v_tenant, v_id, btrim(l ->> 'description'), (l ->> 'quantity')::numeric, coalesce(l ->> 'unit', 'item'),
            (l ->> 'unit_price')::numeric, i);
    i := i + 1;
  end loop;
  return v_id;
end
$$;
revoke all on function public.fl_save_quote(uuid, uuid, numeric, date, text, jsonb) from public, anon;
grant execute on function public.fl_save_quote(uuid, uuid, numeric, date, text, jsonb) to authenticated;

-- A new draft copied from an earlier quote (to change something after it was sent).
create or replace function public.fl_copy_quote(p_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  q public.fl_quotes;
  v_id uuid;
begin
  if not private.fl_owner_ok() then
    raise exception 'Only the owner can make quotes' using errcode = '42501';
  end if;
  select * into q from public.fl_quotes where id = p_id and tenant_id = private.current_tenant_id();
  if not found then raise exception 'Quote not found' using errcode = 'P0002'; end if;
  insert into public.fl_quotes (tenant_id, job_id, number, vat_rate, valid_until, notes)
  values (q.tenant_id, q.job_id, 0, q.vat_rate, null, q.notes) returning id into v_id;
  insert into public.fl_quote_lines (tenant_id, quote_id, description, quantity, unit, unit_price, sort_order)
  select tenant_id, v_id, description, quantity, unit, unit_price, sort_order from public.fl_quote_lines where quote_id = p_id;
  return v_id;
end
$$;
revoke all on function public.fl_copy_quote(uuid) from public, anon;
grant execute on function public.fl_copy_quote(uuid) to authenticated;

---------------------------------------------------------------- enquiry stage: add "quoted"
-- Tells the enquiry list a quote was sent, without exposing any amount (so managers see the stage too).
create or replace function private.fl_job_quoted(p_job uuid)
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.fl_quotes q
                  where q.job_id = p_job and q.tenant_id = private.current_tenant_id() and q.status in ('sent', 'accepted'))
$$;

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
    when private.fl_job_quoted(e.job_id) then 'quoted'
    when exists (select 1 from public.fl_viewing_rooms r where r.viewing_id = v.id) then 'measured'
    when v.viewed_at is not null then 'viewing_booked'
    else 'new'
  end as stage
from public.fl_enquiries e
join public.jobs j on j.id = e.job_id and j.tenant_id = e.tenant_id
left join public.customers c on c.id = j.customer_id and c.tenant_id = j.tenant_id
left join public.fl_viewings v on v.job_id = e.job_id and v.tenant_id = e.tenant_id;
