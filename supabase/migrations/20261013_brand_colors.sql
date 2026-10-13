begin;

-- 3.1 Brand pill colours
-- Two nullable columns on brands, filled from the admin. Each stores a hex
-- colour in #RRGGBB format, enforced by a CHECK. NULL means "no colour set":
-- the storefront falls back to the current cream pill, so every existing
-- brand keeps working unchanged and no backfill is needed.

alter table public.brands
  add column if not exists color_primary   text,
  add column if not exists color_secondary text;

alter table public.brands
  drop constraint if exists brands_color_primary_hex_check;
alter table public.brands
  add constraint brands_color_primary_hex_check
  check (color_primary is null or color_primary ~ '^#[0-9A-Fa-f]{6}$');

alter table public.brands
  drop constraint if exists brands_color_secondary_hex_check;
alter table public.brands
  add constraint brands_color_secondary_hex_check
  check (color_secondary is null or color_secondary ~ '^#[0-9A-Fa-f]{6}$');

-- RLS: no policy changes needed. "brands public read" (select using (true))
-- already exposes the new columns to anon, and "brands admin all" (for all to
-- authenticated using public.is_admin()) already gates every write. RLS is
-- row-level, so new columns inherit both policies; Supabase's default
-- table-level grants likewise cover them.

commit;
