begin;

-- 2.1 New product content + handpicked flags
alter table public.products
  add column if not exists benefits       text,
  add column if not exists dosage_cycle   text,
  add column if not exists product_note   text,
  add column if not exists is_featured    boolean not null default false,
  add column if not exists featured_order integer not null default 0;

create index if not exists products_featured_idx
  on public.products (is_featured, featured_order);

-- 2.2 Richer banners
alter table public.banners
  add column if not exists eyebrow    text,
  add column if not exists cta_label  text,
  add column if not exists cta2_label text,
  add column if not exists cta2_url   text;

-- 2.3 Checkout event log (the data source for best sellers)
create table if not exists public.checkout_events (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  qty        integer not null check (qty > 0 and qty <= 99),
  created_at timestamptz not null default now()
);

create index if not exists checkout_events_created_at_idx
  on public.checkout_events (created_at desc);
create index if not exists checkout_events_product_idx
  on public.checkout_events (product_id);

alter table public.checkout_events enable row level security;

-- anonymous storefront may INSERT only. It can never read the table.
drop policy if exists "checkout_events_insert_public" on public.checkout_events;
create policy "checkout_events_insert_public"
  on public.checkout_events for insert
  to anon, authenticated
  with check (qty > 0 and qty <= 99);

-- admins may read the raw log
drop policy if exists "checkout_events_select_admin" on public.checkout_events;
create policy "checkout_events_select_admin"
  on public.checkout_events for select
  to authenticated
  using (public.is_admin());

-- 2.4 Aggregation function. SECURITY DEFINER because anon cannot select the table.
create or replace function public.best_sellers(
  p_days  integer default 7,
  p_limit integer default 6
)
returns table (pid uuid, total_qty bigint)
language sql
security definer
set search_path = ''
as $$
  select e.product_id as pid, sum(e.qty)::bigint as total_qty
  from public.checkout_events e
  join public.products p on p.id = e.product_id
  where e.created_at >= now() - make_interval(days => p_days)
    and p.is_active = true
  group by e.product_id
  order by total_qty desc, max(e.created_at) desc
  limit p_limit;
$$;

revoke all on function public.best_sellers(integer, integer) from public;
grant execute on function public.best_sellers(integer, integer) to anon, authenticated;

commit;
