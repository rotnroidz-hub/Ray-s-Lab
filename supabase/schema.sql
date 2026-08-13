-- ============================================================================
-- WhatsApp Catalog storefront — Supabase schema & Row Level Security
--
-- Run this whole file in the Supabase SQL editor (Dashboard > SQL Editor).
-- After applying it, follow the "Create the admin user" steps at the bottom.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  image_url   text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists brands (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  image_url   text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists products (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid references categories(id) on delete set null,
  brand_id     uuid references brands(id) on delete set null,
  name         text not null,
  slug         text not null unique,
  description  text not null default '',
  price        numeric(12, 2) not null default 0,
  stock_status text not null default 'available'
               check (stock_status in ('available', 'no_stock')),
  is_active    boolean not null default true,
  images       text[] not null default '{}',
  tags         text[] not null default '{}',
  benefits     text,
  dosage_cycle text,
  product_note text,
  is_featured  boolean not null default false,
  featured_order integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists banners (
  id          uuid primary key default gen_random_uuid(),
  image_url   text not null,
  title       text not null default '',
  subtitle    text not null default '',
  link_url    text not null default '',
  eyebrow     text,
  cta_label   text,
  cta2_label  text,
  cta2_url    text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-maintain updated_at on every row.
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_categories_updated_at on categories;
create trigger trg_categories_updated_at
  before update on categories
  for each row execute function set_updated_at();

drop trigger if exists trg_brands_updated_at on brands;
create trigger trg_brands_updated_at
  before update on brands
  for each row execute function set_updated_at();

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();

drop trigger if exists trg_banners_updated_at on banners;
create trigger trg_banners_updated_at
  before update on banners
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Admin role helper
-- ----------------------------------------------------------------------------

-- Optional, but recommended: lets only *designated* accounts write, instead of
-- every authenticated user. After creating your admin user in Auth > Users,
-- insert a row here:
--
--   insert into public.profiles (id, role)
--   select id, 'admin' from auth.users where email = 'you@example.com';
--
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- is_admin() only ever reads the *caller's own* profile row, which the
-- "profiles self read" policy below already permits. So it runs SECURITY
-- INVOKER with a locked-down search_path — no elevated privileges needed.
-- Every reference is schema-qualified so an empty search_path stays safe.
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Functions default to EXECUTE granted to PUBLIC. Restrict it: the write
-- policies on products/categories/banners evaluate is_admin() for the acting
-- role, so signed-in users need execute; the anonymous storefront does not.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "profiles self read" on profiles;
create policy "profiles self read"
  on profiles for select
  using (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------

alter table categories enable row level security;
alter table brands     enable row level security;
alter table products  enable row level security;
alter table banners   enable row level security;

-- Storefront: anyone may read active products / all categories / live banners.
drop policy if exists "categories public read"   on categories;
drop policy if exists "brands public read"       on brands;
drop policy if exists "products public read"     on products;
drop policy if exists "banners public read"      on banners;

create policy "categories public read"
  on categories for select using (true);

create policy "brands public read"
  on brands for select using (true);

create policy "products public read"
  on products for select using (is_active = true);

create policy "banners public read"
  on banners for select using (is_active = true);

-- Admin: writes restricted to the admin role. The storefront's anon key cannot
-- call any of these — reads only.
--
-- IMPORTANT: these are scoped `to authenticated` so the anonymous storefront
-- NEVER evaluates the is_admin() expression on reads (that would otherwise
-- demand EXECUTE on is_admin() from the anon role and fail).
drop policy if exists "categories admin all" on categories;
drop policy if exists "brands admin all"     on brands;
drop policy if exists "products admin all"   on products;
drop policy if exists "banners admin all"    on banners;

create policy "categories admin all"
  on categories for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "brands admin all"
  on brands for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "products admin all"
  on products for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "banners admin all"
  on banners for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Storage — product images & banner images
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public read of images (needed for the storefront to render them).
drop policy if exists "product-images public read" on storage.objects;
create policy "product-images public read"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Admin write / delete inside the bucket only.
drop policy if exists "product-images admin insert" on storage.objects;
drop policy if exists "product-images admin update" on storage.objects;
drop policy if exists "product-images admin delete" on storage.objects;

create policy "product-images admin insert"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images' and public.is_admin()
  );

create policy "product-images admin update"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product-images admin delete"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------

create index if not exists products_category_idx on products (category_id);
create index if not exists products_brand_idx on products (brand_id);
create index if not exists products_slug_idx on products (slug);
create index if not exists categories_slug_idx on categories (slug);
create index if not exists brands_slug_idx on brands (slug);
create index if not exists products_featured_idx on products (is_featured, featured_order);

-- ----------------------------------------------------------------------------
-- Checkout event log (data source for best sellers)
-- ----------------------------------------------------------------------------

create table if not exists checkout_events (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  qty        integer not null check (qty > 0 and qty <= 99),
  created_at timestamptz not null default now()
);

create index if not exists checkout_events_created_at_idx
  on checkout_events (created_at desc);
create index if not exists checkout_events_product_idx
  on checkout_events (product_id);

alter table checkout_events enable row level security;

-- Anonymous storefront may INSERT only. It can never read the table.
drop policy if exists "checkout_events_insert_public" on checkout_events;
create policy "checkout_events_insert_public"
  on checkout_events for insert
  to anon, authenticated
  with check (qty > 0 and qty <= 99);

-- Admins may read the raw log.
drop policy if exists "checkout_events_select_admin" on checkout_events;
create policy "checkout_events_select_admin"
  on checkout_events for select
  to authenticated
  using (public.is_admin());

-- Aggregation function. SECURITY DEFINER because anon cannot select the table.
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