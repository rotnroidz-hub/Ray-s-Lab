-- ============================================================================
-- Additive migration: Brand filtering (JBL, Sony, Garmin, Anker, …)
--
-- Adds the `brands` table and links products to it, plus the RLS policies
-- and indexes that match the rest of the schema. Safe to run repeatedly
-- (every statement is idempotent). Run in the Supabase SQL editor.
-- ============================================================================

-- Brands table -----------------------------------------------------------
create table if not exists brands (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  image_url   text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Link products to a brand (nullable: a product can have no brand).
alter table products
  add column if not exists brand_id uuid references brands(id) on delete set null;

-- Keep updated_at in sync like the other tables.
drop trigger if exists trg_brands_updated_at on brands;
create trigger trg_brands_updated_at
  before update on brands
  for each row execute function set_updated_at();

-- Row Level Security -----------------------------------------------------
alter table brands enable row level security;

drop policy if exists "brands public read" on brands;
create policy "brands public read"
  on brands for select using (true);

drop policy if exists "brands admin all" on brands;
create policy "brands admin all"
  on brands for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Indexes -----------------------------------------------------------------
create index if not exists products_brand_idx on products (brand_id);
create index if not exists brands_slug_idx on brands (slug);

-- ============================================================================
-- Optional: seed demo brands and assign them to the seed products.
-- Re-run seed.sql (or the block below) if you want the storefront to show
-- brand filters straight away. Skip if you'll add brands via the admin.
-- ============================================================================
insert into brands (name, slug, sort_order) values
  ('JBL',   'jbl',   1),
  ('Sony',  'sony',  2),
  ('Garmin','garmin',3),
  ('Anker', 'anker', 4)
on conflict (slug) do nothing;

update products p set brand_id = b.id
from (values
  ('aria-wireless-headphones', 'sony'),
  ('pulse-portable-speaker',   'jbl'),
  ('ridge-smart-watch',        'garmin'),
  ('trail-runner-band',        'garmin'),
  ('voyage-canvas-backpack',   'anker')
) as x(slug, brand_slug)
join brands b on b.slug = x.brand_slug
where p.slug = x.slug;
