# RAY BODYLAB - STOREFRONT V2 IMPLEMENTATION SPEC

**For:** the coding agent working in `C:\Users\user\catalog-site`
**Read first:** `PROJECT_ANALYSIS.md` in this repo. This spec assumes it.
**Status of every instruction below:** approved by the owner. Do not renegotiate scope.

---

## 0A. OWNER OVERRIDES - THESE BEAT ANYTHING BELOW

Two decisions were changed by the owner after this spec was written. Where this
section and a later section disagree, this section wins.

1. **Section 13.1 says the "Order this on WhatsApp" button is removed. It is not.**
   The button and its reassurance microcopy were restored on 14 August and sit below
   the action row. Do not remove them.
2. **Section 13 says StockBadge sits top-left over the main product image. It does
   not.** Commit 10b moved it into the info column, under the price, where it
   appears once. Do not put it back over the photo.

---

## 0. RULES FOR THE AGENT - READ BEFORE WRITING ANY CODE

1. **Do not invent values.** Every hex code, class name, column name, file path and
   string in this document is exact. Copy them literally. If a value is not in this
   document, keep whatever the repo already has.
2. **Do not redesign.** This spec describes an approved design. If something looks
   odd to you, implement it as written anyway.
3. **Work in the order of the sections.** Section 2 (database) must be applied before
   Section 5 (types), which must be done before Section 6 (data layer), and so on.
   Do not jump ahead.
4. **Run `npm run build` after every numbered section.** It runs `tsc -b` first, so a
   type error fails the build. Fix before moving on.
5. **Never touch these** (from `PROJECT_ANALYSIS.md` §20, they will break things):
   - `build.sourcemap` stays `false` in `vite.config.ts`.
   - Only `VITE_SUPABASE_ANON_KEY` ships. The `service_role` key never appears in `src/`.
   - The `.product-card` class name and the `<img>` inside it are read by the
     fly-to-cart animation. Do not rename either.
   - `id="wc-cart-target"` on the header cart button is the fly-to-cart destination.
   - The cart localStorage key stays `wc-cart-v1`.
   - The cart is cleared on WhatsApp redirect. That is deliberate. Keep it.
   - `is_active = true` filtering stays on every public read.
   - Reassurance microcopy ("no payment taken here", "we confirm over chat") stays on
     the product page, cart drawer and checkout modal.
   - All RLS policies stay. Do not loosen any existing policy.
6. **If a package name in Section 4 does not resolve on npm**, stop and report it
   rather than substituting a different font or icon library.
7. **Ask nothing, assume nothing.** If genuinely blocked, leave a `// SPEC-BLOCKED:`
   comment and continue with the next item.

---

## 1. WHAT IS BEING BUILT

Six changes, all approved:

| # | Change | Why |
| --- | --- | --- |
| 1 | Automatic best sellers driven by real checkout data | Owner wants zero manual curation |
| 2 | Full design token and font replacement | Approved new visual direction |
| 3 | Stock stays a two-state badge: green "Available Stock" / red "No Stock" | No stock counts anywhere |
| 4 | Product detail stays the `/product/:slug` route, restyled | Protects SEO and deep links |
| 5 | "Buy now" = add to cart + open WhatsApp checkout. "Add to cart" = add + toast | No payment gateway exists |
| 6 | Full mobile and tablet pass | Majority of traffic |

Plus three owner-requested content features: an admin-managed **Handpicked** section,
richer **banners**, and three new product content blocks (**Benefits**, **Dos and
cycle**, **Note**).

---

## 2. DATABASE MIGRATION

Create **one** new file: `supabase/migrations/20260813_storefront_v2.sql`

Paste exactly this. Then run it in the Supabase SQL editor (anon-key clients cannot
run DDL, so this is a manual step the owner performs).

```sql
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
```

**Also update `supabase/schema.sql`** so it stays the source of truth: add the same
columns to the `products` and `banners` definitions, and append the whole
`checkout_events` table, its policies and the `best_sellers` function.

**Do NOT add a stock quantity column.** Stock stays `stock_status` with its existing
two values `available` and `no_stock`.

**Note on brands:** the `brands` table EXISTS on the live database, so
`20260812_add_brands.sql` is already applied. Do not run it again and do not treat
brands as optional when building. All brand UI in this spec is live: the two-level
mega menu, the brand facet row on Catalog, and `/brand/:slug` pages.

Keep the existing `ensureBrandsCapability` probe in `api.ts` and `adminApi.ts` anyway.
It costs one cached call and protects local or staging databases that lack the table.
Do not delete it and do not hardcode `brandsCapable = true`.

---

## 3. ENVIRONMENT

Set in `.env` and in Vercel project env vars:

```
VITE_CURRENCY=MYR
VITE_CURRENCY_LABEL=RM
```

Every price in the UI must render through `formatPrice()` from `src/lib/utils.ts`.
**Never hardcode the string `RM` in a component.**

---

## 4. FONTS AND ICONS

### 4.1 Remove
```
@fontsource/fraunces
@fontsource/manrope
```
Delete their imports from `src/main.tsx`.

### 4.2 Install
```
npm i @fontsource-variable/bricolage-grotesque @fontsource-variable/geist @fontsource-variable/geist-mono @tabler/icons-react
```
If any of the three fontsource packages 404, **stop and report**. Do not substitute a
different typeface.

### 4.3 Import in `src/main.tsx`, above the app imports
```ts
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
```

### 4.4 Icons
Use named imports from `@tabler/icons-react`, outline only, `stroke={1.75}` globally.
Example: `import { IconShoppingBag, IconArrowRight } from '@tabler/icons-react';`
Keep the existing `src/components/ui/Icons.tsx` file if other code imports it, but
new work uses Tabler. Do not hand-draw new SVG paths.

Icons used in this spec: `IconSearch`, `IconShoppingBag`, `IconShoppingBagPlus`,
`IconMenu2`, `IconX`, `IconChevronDown`, `IconArrowRight`, `IconArrowLeft`,
`IconArrowDown`, `IconSelector`, `IconCircleCheck`, `IconHeadphones`,
`IconDeviceWatch`, `IconPlug`, `IconBrandWhatsapp`, `IconBrandInstagram`,
`IconBrandFacebook`, `IconBrandTiktok`.

---

## 5. DESIGN TOKENS

### 5.1 Replace the `theme.extend.colors` block in `tailwind.config.js`

Delete the entire cream / pine / brass / clay palette. Replace with exactly:

```js
colors: {
  ink:        '#0E1013',
  'ink-2':    '#1B1E23',
  'ink-soft': '#5B6169',
  'ink-faint':'#8A9099',

  paper:      '#F5F4EF',
  'paper-2':  '#FAF9F5',
  card:       '#FFFFFF',

  blue:       '#0090E6',
  'blue-deep':'#0B5FA8',
  'blue-lite':'#5EC2FF',

  'stock-ok':      '#167A46',
  'stock-ok-soft': '#E3F3E9',
  'stock-no':      '#B3261E',
  'stock-no-soft': '#FBEAE8',

  line:       'rgba(14,16,19,0.12)',
  'line-soft':'rgba(14,16,19,0.07)',
},
```

`blue` is the one and only accent. Every former `pine` usage becomes `ink`, every
former `brass` usage becomes `blue-deep`, every former `clay` usage becomes
`stock-no`. Grep the repo for `pine`, `brass`, `clay`, `canvas` and replace all of
them. Zero occurrences may remain.

### 5.2 Fonts in `tailwind.config.js`
```js
fontFamily: {
  display: ['"Bricolage Grotesque Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  sans:    ['"Geist Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  mono:    ['"Geist Mono Variable"', 'ui-monospace', 'monospace'],
},
```

Usage rules, apply everywhere:
- `font-display` with `font-extrabold tracking-[-0.035em] leading-[0.98]` for every
  page heading, section heading, product name heading and the logo wordmark.
- `font-sans` for all body copy, buttons, form fields and nav.
- `font-mono` for prices, counts, small uppercase labels, spec values and the
  eyebrow labels.
- **Fraunces is banned. Manrope is banned.** No serif anywhere in the app.

### 5.3 Radii and shadows
```js
borderRadius: { card: '14px', tile: '14px' },
boxShadow: {
  card: '0 1px 2px rgba(14,16,19,0.04)',
  lift: '0 10px 30px rgba(14,16,19,0.08)',
  drawer: '0 12px 34px rgba(14,16,19,0.24)',
},
```
Rule: buttons and chips are `rounded-full`. Cards, tiles and panels are
`rounded-card`. Inputs are `rounded-full`. Nothing else. No mixed radii.

---

## 6. TEXTURE LAYERS - `src/index.css`

Delete the existing body gradient, the `body::after` film grain, and `.tile-texture`.
Replace with this. It is three fixed layers below the content.

```css
@layer base {
  body {
    @apply bg-paper text-ink font-sans antialiased;
    position: relative;
  }

  .tex-layer {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  /* embossed hexagon paper */
  .tex-emboss {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='24' viewBox='0 0 14 24'%3E%3Cpolygon points='7,0.9 13.4,4.6 13.4,12 7,15.7 0.6,12 0.6,4.6' fill='none' stroke='%230E1013' stroke-opacity='0.2' stroke-width='0.6'/%3E%3Cpolygon points='7,0 13.4,3.7 13.4,11.1 7,14.8 0.6,11.1 0.6,3.7' fill='none' stroke='%23FFFFFF' stroke-opacity='1' stroke-width='0.7'/%3E%3C/svg%3E");
    background-size: 14px 24px;
  }

  /* gradient tint masked to the hexagon outlines, desktop only */
  .tex-tint {
    background: linear-gradient(135deg, #0090E6 0%, #5EC2FF 18%, #0B5FA8 42%, #0E1013 68%, #0090E6 100%);
    background-size: 180% 180%;
    opacity: 0.22;
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='24' viewBox='0 0 14 24'%3E%3Cpolygon points='7,0.45 13.4,4.15 13.4,11.55 7,15.25 0.6,11.55 0.6,4.15' fill='none' stroke='%23fff' stroke-width='0.85'/%3E%3C/svg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='24' viewBox='0 0 14 24'%3E%3Cpolygon points='7,0.45 13.4,4.15 13.4,11.55 7,15.25 0.6,11.55 0.6,4.15' fill='none' stroke='%23fff' stroke-width='0.85'/%3E%3C/svg%3E");
    -webkit-mask-size: 14px 24px;
            mask-size: 14px 24px;
  }

  /* PERFORMANCE: the masked layer repaints on scroll on mid-range Android.
     Below 640px it is switched off entirely and the emboss carries the texture. */
  @media (max-width: 639px) {
    .tex-tint { display: none; }
    .tex-emboss { opacity: 0.85; }
  }

  .tex-grain {
    opacity: 0.05;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  /* dark surfaces that carry NO photo: banner copy panel, footer */
  .tex-dark {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='24' viewBox='0 0 14 24'%3E%3Cpolygon points='7,0.9 13.4,4.6 13.4,12 7,15.7 0.6,12 0.6,4.6' fill='none' stroke='%23FFFFFF' stroke-opacity='0.14' stroke-width='0.6'/%3E%3Cpolygon points='7,0 13.4,3.7 13.4,11.1 7,14.8 0.6,11.1 0.6,3.7' fill='none' stroke='%23000000' stroke-opacity='0.55' stroke-width='0.7'/%3E%3C/svg%3E");
    background-size: 14px 24px;
  }

  .tex-glow {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(135deg, #0090E6 0%, #5EC2FF 22%, transparent 55%);
    opacity: 0.3;
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='24' viewBox='0 0 14 24'%3E%3Cpolygon points='7,0.45 13.4,4.15 13.4,11.55 7,15.25 0.6,11.55 0.6,4.15' fill='none' stroke='%23fff' stroke-width='0.9'/%3E%3C/svg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='24' viewBox='0 0 14 24'%3E%3Cpolygon points='7,0.45 13.4,4.15 13.4,11.55 7,15.25 0.6,11.55 0.6,4.15' fill='none' stroke='%23fff' stroke-width='0.9'/%3E%3C/svg%3E");
    -webkit-mask-size: 14px 24px;
            mask-size: 14px 24px;
  }
  @media (max-width: 639px) { .tex-glow { display: none; } }
}
```

Mount the three fixed layers once, as the first children inside `StoreLayout` in
`src/components/layout/Layout.tsx`:
```tsx
<div className="tex-layer tex-emboss" aria-hidden />
<div className="tex-layer tex-tint" aria-hidden />
<div className="tex-layer tex-grain" aria-hidden />
```
Content must sit above them. Give the page wrapper `relative z-[1]`.

### 6.1 THE MOST IMPORTANT TEXTURE RULE

**Hexagon texture must NEVER be painted on top of a photograph.** The owner rejected
this explicitly. It made images look like they were behind a mesh screen.

- Blocks that contain a photo (banner image half, handpicked cards, category tiles,
  product cards, product gallery): **no `tex-dark`, no `tex-glow`, ever.**
- Blocks with no photo (the dark copy half of a banner slide, the footer): texture
  is required.

### 6.2 Gradient edge utility

Add to `@layer components` in `src/index.css`:
```css
.edge { position: relative; }
.edge::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(140deg,
    rgba(0,144,230,0.85) 0%,
    rgba(94,194,255,0.35) 22%,
    rgba(14,16,19,0.10) 55%,
    rgba(11,95,168,0.55) 100%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  pointer-events: none;
  opacity: 0.75;
  transition: opacity 0.25s;
}
.edge:hover::after { opacity: 1; }
```
Apply `.edge` to: product cards, best seller rail cards, title plates. Nothing else.

---

## 7. TYPES - `src/lib/types.ts`

Add to the `Product` type:
```ts
benefits: string | null;
dosage_cycle: string | null;
product_note: string | null;
is_featured: boolean;
featured_order: number;
```

Add to the `Banner` type:
```ts
eyebrow: string | null;
cta_label: string | null;
cta2_label: string | null;
cta2_url: string | null;
```

Add:
```ts
export type SortKey = 'featured' | 'price_asc' | 'price_desc';
```

---

## 8. DATA LAYER

### 8.1 `src/lib/api.ts`

**a) Sorting.** Extend `fetchProducts` options with `sort?: SortKey`. Map:
- `featured` (default) → `.order('created_at', { ascending: false })` (unchanged)
- `price_asc` → `.order('price', { ascending: true })`
- `price_desc` → `.order('price', { ascending: false })`

**b) Handpicked.** New function:
```ts
export async function fetchFeaturedProducts(limit = 2): Promise<Product[]>
```
Filter `is_active = true` and `is_featured = true`, order `featured_order asc`,
then `created_at desc`, limit `limit`. Hydrate with `hydrateProduct` like everything else.

**c) Best sellers.** New function:
```ts
export async function fetchBestSellers(limit = 6): Promise<Product[]>
```
Implementation, in this exact order:
1. `supabase.rpc('best_sellers', { p_days: 7, p_limit: limit })`.
2. If it errors, **do not throw**. Log to console and treat as an empty result.
3. Map the returned rows to `pid` in order, then call the existing
   `fetchProductsByIds(ids)` and **re-sort the returned array back into the RPC's
   order** (`fetchProductsByIds` does not preserve order).
4. If fewer than `limit` products came back, top up with the newest active products
   that are not already in the list, until you have `limit` or run out.
5. Return the array. It may be shorter than `limit`. Never throw.

**d) Brand to category map** for the mega menu. New function:
```ts
export async function fetchBrandCategoryMap(): Promise<BrandMenuEntry[]>
```
where
```ts
export type BrandMenuEntry = {
  brand: { id: string; name: string; slug: string };
  total: number;
  categories: { name: string; slug: string; count: number }[];
};
```
One query: select `brand_id, category_id, brands(id,name,slug), categories(id,name,slug)`
from `products` where `is_active = true`. Aggregate in JS into the shape above,
counting products per brand per category. Sort brands by `total` descending, then
name. Sort categories inside each brand by `count` descending.
Cache the promise at module level so repeated calls do not refetch.
**If `brandsCapable` is false, return `[]`** and the whole Brands menu hides.

**e) Checkout logging.** New function:
```ts
export async function logCheckout(items: { product_id: string; qty: number }[]): Promise<void>
```
Single `insert` of all rows into `checkout_events`. Wrap in try/catch and swallow
every error. **This function must never block, never throw, and never delay the
WhatsApp redirect.** Fire and forget.

### 8.2 `src/hooks/useData.ts`

Add, following the existing `useAsync` pattern exactly:
- `useFeaturedProducts(limit = 2)`
- `useBestSellers(limit = 6)`
- `useBrandMenu()`

Extend `useProducts(categorySlug?, search?, pageSize?, brandSlug?, sort?)` with the
new sort argument. Adding sort to the dep array must reset pagination to page 0,
same as the existing behaviour when the query key changes.

### 8.3 `src/lib/adminApi.ts`

- Product create and update must pass through `benefits`, `dosage_cycle`,
  `product_note`, `is_featured`, `featured_order`.
- Banner create and update must pass through `eyebrow`, `cta_label`, `cta2_label`,
  `cta2_url`.
- Add `reorderFeatured(rows: { id: string; featured_order: number }[])` using the
  same `upsert` pattern as the existing reorder helpers.

---

## 9. SHARED COMPONENTS

### 9.1 `Reveal` - `src/components/ui/Reveal.tsx` - REWRITE

Current behaviour animates once and unobserves. **The owner explicitly wants it to
replay every time an element enters the viewport, scrolling in either direction.**

New behaviour:
- IntersectionObserver with `threshold: 0.12` and `rootMargin: '0px 0px -4% 0px'`.
- On intersect: add the visible state. On exit: **remove it**, so it animates again
  on the next entry. Do not call `unobserve`.
- Transition: `opacity` and `translateY(24px) → 0`, duration `0.65s`,
  easing `cubic-bezier(0.19, 1, 0.22, 1)`.
- Optional `index` prop applies `transition-delay: (index % 4) * 70ms`.
- If `prefers-reduced-motion: reduce`, render visible permanently and never toggle.

Apply `Reveal` to: handpicked cards, category tiles, product cards, best seller rail
cards, footer columns.

### 9.2 `TitlePlate` - NEW - `src/components/ui/TitlePlate.tsx`

This is the approved section heading treatment. It replaces every plain section
heading on Home, Catalog, Category and Brand.

Props:
```ts
{
  kicker?: string;           // small uppercase mono label, optional
  words: string[];           // heading split into words, each animates separately
  count?: number;            // large mono number on the right, counts up
  countLabel?: string;       // small mono label under the count
  children?: React.ReactNode;// the row beneath the rule: chips, buttons, a sentence
}
```

Structure and styling:
- Wrapper: `.edge relative bg-paper-2 rounded-card px-7 pt-6 pb-5 overflow-hidden`
  with `box-shadow: inset 0 1px 0 rgba(255,255,255,0.95), 0 1px 2px rgba(14,16,19,0.04)`.
- Two corner brackets, 14x14px, `border: 1.5px solid #0090E6`, top-left has no right
  or bottom border, bottom-right has no left or top border. Both inset 10px.
- A sweep element: 80px wide, full height, absolutely positioned, background
  `linear-gradient(90deg, transparent, rgba(0,144,230,0.13), transparent)`, animating
  `left: -100px → 110%` over 1.05s.
- Kicker: `font-mono text-[11.5px] tracking-[0.14em] uppercase text-blue-deep`.
- Heading: `font-display text-[clamp(30px,4vw,46px)]`. Each word wrapped in a
  `overflow-hidden inline-block` mask, inner span starts at `translateY(112%)` and
  rises to 0 over 0.72s with `cubic-bezier(0.19,1,0.22,1)`, staggered 90ms per word.
- Count: `font-mono text-[30px] font-medium`, label below in
  `font-mono text-[11.5px] text-ink-soft tracking-[0.08em]`.
- Rule: 1px `bg-line`, `transform: scaleX(0)` origin left, animating to 1 over 0.6s
  with a 0.26s delay.

**Replay requirement:** identical to `Reveal`. Observe at `threshold: 0.35`. On
entry, remove the animation class, force a reflow (`void el.offsetWidth`), then
re-add it, so the CSS animation actually restarts. On exit, remove the class, clear
the counter interval and reset the displayed number to `0`. The count must tick up
from 0 on every entry, not just the first.

Under `prefers-reduced-motion: reduce`: everything renders in its final state, the
count shows its final value immediately, no observers toggle anything.

Mobile: below 768px the heading and the count stack vertically, count left-aligned.

### 9.3 `Toast` - NEW - `src/components/ui/Toast.tsx`

The repo has no feedback system. Add a minimal one.
- Context provider `ToastProvider` with `useToast()` exposing `showToast(message)`.
- Mount the provider inside `StoreLayout`, wrapping everything.
- Visual: fixed, bottom 28px, horizontally centred, `bg-ink text-paper-2`,
  `rounded-full px-6 py-3.5 text-sm`, `shadow-drawer`, with an `IconCircleCheck` in
  `text-blue-lite` at 18px. Slides up 20px and fades in, auto-dismisses after 2400ms.
- `role="status"` and `aria-live="polite"`.
- On mobile, bottom offset becomes 96px so it clears the sticky product bar.

### 9.4 `StockBadge` - `src/components/ui/StockBadge.tsx` - RESTYLE ONLY

Behaviour and the two states are unchanged. Only colours change:
- `available` → text `stock-ok`, background `stock-ok-soft`, label **"Available Stock"**
- `no_stock` → text `stock-no`, background `stock-no-soft`, label **"No Stock"**

`rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-[0.08em]`.
**Never render a number.** There is no stock count in this system.

### 9.5 `Button` - `src/components/ui/Button.tsx`

Keep the existing variant API. Restyle:
- height `md` 48px, `sm` 40px, `lg` 54px. All `rounded-full`, `font-sans`,
  `text-[14.5px] font-medium`, `whitespace-nowrap`.
- `primary`: `bg-blue text-white`, hover `bg-[#0a9ff5]` plus
  `shadow-[0_6px_20px_rgba(0,144,230,0.28)]`.
- `dark` (NEW variant): `bg-ink text-paper-2`, hover `bg-ink-2`. Used for "Buy now".
- `outline`: `bg-card text-ink border border-line`, hover `border-ink`.
- `ghost-dark`: transparent, `text-paper-2`, `border-white/30`, hover `border-paper-2`.
- `whatsapp`: keep the existing green, it is a recognised brand colour.
- Active state on all: `translate-y-[1px]`.
- **Minimum tap target 44px on touch devices.** `sm` buttons get `min-h-[44px]` under
  the `md` breakpoint.
- No button label may wrap to two lines at any width.

---

## 10. HEADER - `src/components/layout/Header.tsx`

### 10.1 Logo
Two image assets are supplied alongside this spec: `logo-mark.png` (the hexagon
emblem, transparent background) and `logo-full-white.png` (the full stacked lockup
recoloured white with a transparent background, for dark surfaces).

Both are already in `public/`, so they are served from the site root. Header uses:
```tsx
<img src="/logo-mark.png" alt="" className="h-[46px] w-auto" />
<span className="font-display font-extrabold text-[17px] leading-[1.02] tracking-[-0.02em]">
  RAY<br />BODY<em className="not-italic text-blue">LAB</em>
</span>
```
The wordmark is a real `<span>`, not part of the image, so it stays crisp and
readable. Header height is 78px desktop, 64px mobile. Sticky, `bg-paper/90` with
`backdrop-blur`, and a bottom border plus shadow that appear only once scrolled
(use an IntersectionObserver on a 1px sentinel div, **not** a scroll listener).

### 10.2 Brands mega menu - DESKTOP (`lg` and up)

Trigger is a nav pill labelled "Brands" with `IconChevronDown` that rotates 180deg on
open. Opens on hover and on focus-within.

Panel: 640px wide, `bg-paper-2`, `border border-line`, `rounded-card`, two columns
`grid-template-columns: 206px 1fr`, `shadow-[0_22px_54px_rgba(14,16,19,0.14)]`.

- **Left column:** one row per brand from `useBrandMenu()`. Each row shows the brand
  name and, right-aligned, its product count in `font-mono text-[11.5px] text-ink-faint`.
  Hovering or focusing a row sets it active: `bg-ink text-paper-2`, and its count
  turns `text-blue`.
- **Right column:** driven by the active brand. Shows the brand name in
  `font-display text-[22px]`, a sub-line reading `{total} items in stock`, then a
  two-column grid of that brand's categories. Each category is a link to
  `/catalog?brand={brandSlug}&category={categorySlug}` showing an icon, the category
  name, and its count right-aligned.
- Default active row is the first brand.
- The entire panel is keyboard reachable. Arrow keys move between brand rows, Escape
  closes and returns focus to the trigger.

**This two-level structure is the point of the feature.** A brand must expand into
that brand's own categories with counts. Do not flatten it to a single list.

### 10.3 Brands menu - MOBILE and TABLET (below `lg`)

No hover. Inside the existing mobile menu accordion:
1. Tapping "Brands" expands a list of brand rows.
2. Tapping a brand row expands that brand's categories underneath it, indented.
3. Only one brand expands at a time.
4. Every row is at least 44px tall.
Use height animation, matching the existing mobile menu behaviour.

---

## 11. HOME PAGE - `src/pages/Home.tsx`

Section order, top to bottom: **Banner carousel → Handpicked → Category bento →
Best sellers**. Home does not show the full product grid; that lives on `/catalog`.

### 11.1 Banner carousel - REPLACES the current HeroCarousel

**One block. Multiple slides.** Not two stacked blocks.

Container: `rounded-[18px] overflow-hidden bg-ink min-h-[520px] relative`,
`min-h-[440px]` below `lg`.

Each slide is a two-column grid, `1.05fr 0.95fr`:
- **Left, the copy panel.** `bg-ink`, padding `clamp(30px,4.4vw,62px)`, vertically
  centred. It has **no photo**, so it gets `tex-dark` at opacity 0.9 and `tex-glow`
  at 0.32 behind the text, with the text at `relative z-[2]`.
  Content, all from the `banners` row: `eyebrow` in
  `font-mono text-[11.5px] tracking-[0.16em] uppercase text-blue-lite`; `title` as
  `font-display text-[clamp(32px,4.3vw,56px)] text-paper-2 max-w-[15ch]`; `subtitle`
  as `text-[15.5px] leading-[1.6] text-paper-2/[0.66] max-w-[42ch]`; then up to two
  buttons: `cta_label` linking to `link_url` as `primary`, and `cta2_label` linking
  to `cta2_url` as `ghost-dark`. **Render a button only when its label is non-empty.**
- **Right, the image.** `image_url`, `object-cover`, full bleed. **Absolutely no
  hexagon texture over this image.** A single left-to-right scrim sits on it:
  `linear-gradient(90deg, #0E1013 0%, rgba(14,16,19,0.35) 45%, transparent 100%)`
  so the copy panel blends into the photo.
- One blue radial glow, 520px square, positioned top -140px right 18%, behind the
  copy: `radial-gradient(circle, rgba(0,144,230,0.42), transparent 68%)`.

Controls, bottom-left, aligned to the copy padding:
- Dots: 8px, `bg-paper-2/[0.32]`, the active one widens to 26px and turns `bg-blue`.
  Each dot has `aria-current` and a 44px invisible tap target on touch.
- Two arrow buttons, 36px circles, `border-white/26`, `bg-white/[0.07]`.
  **Hidden below `lg`** (mobile uses swipe instead).

Behaviour:
- Auto-advance every 6500ms. Pauses on hover and on focus-within. Stops entirely
  under `prefers-reduced-motion: reduce`.
- Below `lg`: the image column is hidden, the copy panel goes full width, and
  horizontal swipe changes slides. Use the existing framer-motion drag pattern.
- Empty state, no banners in the DB: a single dark panel reading "Add a hero banner
  in the admin" with a link to `/admin/banners`. Keep this, it already exists.

### 11.2 Handpicked section

`TitlePlate` with `kicker="Handpicked this week"`, `words={['Chosen,','not','churned.']}`,
`count={featured.length}`, `countLabel="picks"`, and in the children row a short
sentence plus an outline button "See all products" linking to `/catalog`.

Below it, `useFeaturedProducts(2)` rendered as a two-column grid, `1.35fr 1fr`,
gap 14px, each card `min-h-[440px] rounded-tile overflow-hidden`:
- Full-bleed product cover image, `object-cover`. **No texture over it.**
- A vertical scrim so text stays readable:
  `linear-gradient(180deg, rgba(14,16,19,0.28) 0%, rgba(14,16,19,0.62) 48%, rgba(14,16,19,0.96) 100%)`.
- A price pill top-right: `font-mono`, `bg-white/[0.14]`, `border-white/[0.26]`,
  `backdrop-blur-[6px]`, `rounded-full px-3 py-2`, value from `formatPrice()`.
- Bottom-anchored: brand and category in
  `font-mono text-[11.5px] uppercase tracking-[0.12em] text-paper-2/[0.72]`, then the
  product name in `font-display text-[clamp(23px,2.4vw,30px)] text-paper-2`, then the
  first 120 characters of `description`, then a `primary` button "View product".
- The whole card is a link to `/product/{slug}`.

Counts: exactly 2 featured → the split above. Exactly 1 → one full-width card.
0 featured → **hide the entire section**, plate included.
More than 2 in the DB → render only the first 2 by `featured_order`.

Below `lg`: single column, `min-h-[360px]`.

### 11.3 Category bento

Three tiles in a `1.4fr 1fr` / two-row grid, 470px tall. First tile spans both rows.
Each tile: category `image_url` full bleed, scrim
`linear-gradient(180deg, rgba(14,16,19,0.18) 0%, rgba(14,16,19,0.5) 45%, rgba(14,16,19,0.9) 100%)`,
category name in `font-display text-[24px] text-paper-2` bottom-left, product count
beneath in `font-mono text-[12px] text-blue-lite`. Links to `/category/{slug}`.
Image scales to 1.05 on hover. **No texture over these tiles.**
If a category has no `image_url`, fall back to a flat `bg-ink-2` tile with the
`tex-dark` and `tex-glow` layers, since there is no photo in that case.

Cell count must equal category count. With 3 categories use the layout above. With 2,
use two equal columns. With 4 or more, a 2x2 grid showing the first 4. Never render
an empty cell.

Below `lg`: single column, three rows of 190px.

### 11.4 Best sellers rail

`TitlePlate` with `kicker="Moving fastest right now"`, `words={['Best','sellers']}`,
`count={bestSellers.length}`, `countLabel="this month"`, and in the children row the
sentence "Ranked by what actually left the shelf over the last seven days." plus two
scroll arrow buttons.

Below it, a horizontal rail from `useBestSellers(6)`:
- `display:flex; gap:14px; overflow-x:auto; scroll-snap-type:x mandatory;
   scroll-behavior:smooth; scrollbar-width:none` and a hidden webkit scrollbar.
- Each card `flex: 0 0 300px; scroll-snap-align: start`, `.edge`, `bg-card`,
  `rounded-card`. Square cover image on top with the rank numeral overlaid top-left in
  `font-display font-extrabold text-[54px] text-paper-2` with
  `text-shadow: 0 2px 18px rgba(14,16,19,0.5)`. Below: brand, name, price, then the
  same Buy now / Add to cart pair as a product card.
- Arrows scroll by 314px. **Arrows are hidden on touch devices** via
  `@media (hover: none) { display: none }`. The rail swipes natively.
- Below `sm`, card width becomes `78vw` so the next card peeks in.
- If `fetchBestSellers` returns fewer than 2 products, hide the whole section.

**The owner will never curate this list.** It is entirely derived from
`checkout_events`. Do not add an admin screen for it.

---

## 12. CATALOG PAGE - `src/pages/Catalog.tsx`

Replace the current sticky facet bar with a `TitlePlate`:
- `words={['All','products']}`, `count={count}` from `useProducts`,
  `countLabel="in stock now"`.
- The children row holds the filter chips and the sort button.

Chips: one "All" chip plus one per category, each showing its name and count in
`font-mono text-[11.5px]`. Active chip is `bg-ink text-paper-2` with its count in
`text-blue`. Use `aria-pressed`. Brand chips render in a second row only when
`brandsCapable` is true.

Sort button, right-aligned in the same row, cycles through
`featured → price low to high → price high to low` and passes the `SortKey` to
`useProducts`. Label reads `Sort: {current}`.

Below the plate: the category bento (same component as Home), then the product grid.

Grid: `grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4`. Keep this, it
already exists and works.

Load more pill stays. Empty state stays.

**Filters must write back to the URL** as `?category=&brand=&sort=` so a filtered
view is shareable, and must seed from the URL on mount. This fixes the known
one-way-deep-link limitation.

Mobile: the chip row becomes a horizontally scrollable strip with
`scroll-snap-type: x proximity`, `-webkit-overflow-scrolling: touch`, hidden
scrollbar, and a 24px fade at the right edge implemented as a
`mask-image: linear-gradient(90deg, #000 calc(100% - 24px), transparent)`.
Every chip is at least 44px tall.

---

## 13. PRODUCT PAGE - `src/pages/Product.tsx`

Stays the `/product/:slug` route. Keep `useSeo` and the `productJsonLd` schema.org
block exactly as they are.

Layout: two columns, `1.05fr 1fr`, single column below `lg`.

**Left, gallery.** `bg-paper` panel, padding `clamp(20px,3vw,40px)`. Main image in a
`rounded-card` frame at `aspect-[4/3]`, with the existing AnimatePresence crossfade
on thumbnail change. A three-across thumbnail grid beneath, each `aspect-square`
`rounded-[10px]`, active one bordered `border-blue`. `StockBadge` sits top-left over
the main image. Keep `data-main-image` on the main `<img>` for fly-to-cart.
**No hexagon texture over any product photo.**

**Right, info panel.** Padding `clamp(24px,3vw,46px)`.
1. Breadcrumb in `font-mono text-[11.5px] uppercase tracking-[0.1em] text-ink-faint`,
   with the category segment in `text-blue-deep`. Links to catalog and category.
2. Product name, `font-display text-[clamp(26px,2.9vw,38px)]`.
3. Price, `font-mono text-[28px] font-medium`, via `formatPrice()`.
4. `StockBadge`.
5. Description, `text-[15px] leading-[1.68] text-ink-soft whitespace-pre-line max-w-[48ch]`.
6. `QuantityStepper` and the two buttons, on one row, wrapping on narrow screens.
7. Existing reassurance microcopy. Keep it.
8. **Three content blocks**, in this exact order, each separated by a
   `border-t border-line` with `py-5`:

   | Heading text | Source column |
   | --- | --- |
   | `Benefits` | `benefits` |
   | `Dos and cycle` followed by `(for reference only)` | `dosage_cycle` |
   | `Note` | `product_note` |

   Heading style: `font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint`.
   The `(for reference only)` part is a `<em class="not-italic normal-case tracking-[0.02em] text-blue-deep">`
   inside the same heading.
   Body style: `text-[14.5px] leading-[1.68] text-ink-soft max-w-[48ch] whitespace-pre-line`.
   **When the column is null or empty, render the heading and the placeholder line
   `Not filled in yet. Add this from the admin.` in
   `text-[13.5px] italic text-ink-faint`.** The owner wants these visible and blank
   for now. Do not hide empty blocks.

**The old Specifications table is deleted.** So are the Warranty and Delivery rows.

Related products section stays, restyled to the new product card.

### 13.1 Buttons, the approved semantics

- **"Add to cart"** → `addItem(product, qty)`, fire the fly-to-cart animation, show
  the toast `{product.name} added to cart`. Does not open anything.
- **"Buy now"** → `addItem(product, qty)` then `openCheckout()` immediately. It skips
  the cart drawer and goes straight to the WhatsApp checkout modal.
- Both are **disabled when `stock_status === 'no_stock'`**, and the disabled label
  reads "No Stock".
- "Buy now" uses the `dark` button variant. "Add to cart" uses `outline` with an
  `IconShoppingBagPlus`.
- The old "Order this on WhatsApp" button is removed. "Buy now" replaces it.

### 13.2 Mobile sticky action bar (below `lg`)

A bar fixed to the bottom of the viewport, `bg-paper-2/95 backdrop-blur`,
`border-t border-line`, `px-4 py-3`, `z-40`, respecting
`padding-bottom: env(safe-area-inset-bottom)`.
Contents: the price on the left in `font-mono text-[17px]`, then "Add to cart" and
"Buy now" side by side, both 48px tall. It appears once the main gallery has scrolled
out of view, using an IntersectionObserver on the gallery. The page gets
`pb-24 lg:pb-0` so the bar never covers the last content.

---

## 14. PRODUCT CARD - `src/components/catalog/ProductCard.tsx`

Keep the `.product-card` class and the inner `<img>`, the fly-to-cart animation
depends on both.

- `bg-card rounded-card overflow-hidden .edge`, hover `shadow-lift`.
- Image `aspect-[4/3] object-cover`, scales to 1.05 on hover.
- `StockBadge` absolutely positioned top-left, 11px inset.
- Body: brand in `font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint`,
  name in `text-[14.5px] font-medium leading-[1.3]`, price in
  `font-mono text-[16px] font-medium`.
- Actions row: `grid-cols-[1fr_auto] gap-[7px]`. "Buy now" as `dark sm` filling the
  first cell, and an icon-only `outline sm` add-to-cart button with
  `aria-label="Add {name} to cart"` in the second.
- The card itself links to `/product/{slug}`. Both buttons must call
  `e.preventDefault()` and `e.stopPropagation()` so they do not trigger navigation.
- Out of stock: both buttons disabled, card still navigates.

---

## 15. CART AND CHECKOUT

### 15.1 `CartDrawer.tsx`

- Desktop and tablet: right-hand drawer, 420px, unchanged behaviour, restyled.
- **Below 640px: a bottom sheet.** Slides up from the bottom, `max-height: 88dvh`,
  `rounded-t-[18px]`, with a 36x4px grab handle centred at the top. Swipe down over
  100px closes it.
- Totals block: `Subtotal` then a `Delivery` row reading **"Calculated at checkout"**
  then `Total`. Do not compute a shipping figure, this business has no shipping table.
- CTA stays "Checkout via WhatsApp".
- **Add a focus trap, Escape to close, and focus return to the trigger.** Set
  `aria-modal="true"` and `role="dialog"`.

### 15.2 `CheckoutModal.tsx`

Behaviour is unchanged except for one addition. In the send handler, **immediately
before** building the `wa.me` link:

```ts
void logCheckout(items.map(i => ({ product_id: i.product_id, qty: i.qty })));
```

Requirements, all mandatory:
- It is fire and forget. Do not `await` it.
- It must not delay the existing ~450ms redirect timing.
- If it fails, the checkout continues exactly as before. The customer must never see
  an error from this.

This single line is what makes the best sellers rail work. Without it the rail has no
data and will fall back to newest products forever.

Also add the same focus trap and Escape handling as the drawer.

---

## 16. FOOTER - `src/components/layout/Footer.tsx`

Full-width `bg-ink` block. It has no photo, so it gets `tex-dark` and `tex-glow`.

- Left column: `/logo-full-white.png` at `h-[132px] w-auto`, then a short
  paragraph in `text-[14px] leading-[1.65] text-paper-2/60 max-w-[38ch]`, then four
  round social buttons, 40px, `border-white/[0.22]`, hover `bg-blue border-blue`,
  using the Tabler brand icons.
- Right: three link columns, `Shop`, `Brands`, `Support`. Column headings in
  `font-mono text-[11px] uppercase tracking-[0.14em] text-blue-lite`. Links in
  `text-[14px] text-paper-2/[0.66]`, hover `text-paper-2`.
- Bottom bar: `border-t border-white/[0.14]`, **centred**, a single line:
  `Copyright 2026 Ray BodyLab. All rights reserved.`
- **Do not print a street address or opening hours.** The owner removed that line
  deliberately. No location string appears anywhere in the app.

Below `lg`: brand block stacks above the links, links become two columns.

---

## 17. ADMIN

### 17.1 `src/admin/pages/ProductForm.tsx`

Keep the existing Details, Photos and Status card structure. Add:

**In Details, after `description`:**
| Field | Type | Helper text under the field |
| --- | --- | --- |
| Benefits | textarea, 5 rows | `Shown on the product page under Benefits. Leave blank to show a placeholder.` |
| Dos and cycle | textarea, 5 rows | `Shown under "Dos and cycle (for reference only)". Leave blank to show a placeholder.` |
| Note | textarea, 3 rows | `Shown under Note. Leave blank to show a placeholder.` |

All three accept plain text with line breaks and render with `whitespace-pre-line`.
None are required.

**In Status, a third toggle:**
| Toggle | Label | Sub-label |
| --- | --- | --- |
| `is_featured` | `Handpicked` | `Shows in the Handpicked section on the home page. Only the first two are displayed.` |

### 17.2 `src/admin/pages/Featured.tsx` - NEW PAGE

Route `/admin/featured`, added to the `AdminLayout` sidebar between Products and
Categories, labelled **"Handpicked"**.

- Lists every product with `is_featured = true`, ordered by `featured_order`.
- Each row: thumbnail, name, price, up and down reorder buttons, and a "Remove"
  button that sets `is_featured = false`.
- Rows past position 2 are dimmed to 50% with the caption
  `Not shown, only the top two appear on the home page.`
- An "Add product" control at the top: a searchable select of non-featured products
  that sets `is_featured = true` and appends it to the end of the order.
- Reorder persists through `reorderFeatured`.
- Empty state: `Nothing handpicked yet. The Handpicked section is hidden on the home page.`

### 17.3 `src/admin/pages/Banners.tsx`

Add four fields to the existing add and edit panel, in this order:
`Eyebrow`, then the existing `Title` and `Subtitle`, then `Button label` (`cta_label`)
paired with the existing `Link URL` (`link_url`), then `Second button label`
(`cta2_label`) paired with `Second button URL` (`cta2_url`).

Helper text under the button label fields:
`Leave the label blank to hide that button.`

Update the 21:9 preview to render eyebrow, title, subtitle and both button labels so
the admin sees what the slide will look like.

### 17.4 Dashboard

Add a fourth stat card: **"Checkouts this week"**, the count of `checkout_events`
rows from the last 7 days. Admins can read the table directly under the
`checkout_events_select_admin` policy.

### 17.5 Admin styling

Restyle to the new tokens like the rest of the app, but keep it utilitarian. Replace
the native `confirm()` and `alert()` calls with a small inline confirmation row
inside the affected list item: the row turns `bg-stock-no-soft` and shows
`Delete this? [Cancel] [Delete]`.

---

## 18. MOBILE AND TABLET, CONSOLIDATED CHECKLIST

Breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`.

1. Every interactive element is at least 44x44px on touch. Banner dots, filter chips,
   thumbnails, icon buttons, reorder arrows, all of them.
2. Banner: image column hidden below `lg`, copy full width, swipe to change slides,
   arrows hidden, dots keep 44px tap targets.
3. Brands menu becomes the two-level accordion described in 10.3.
4. Product page gets the sticky bottom action bar described in 13.2.
5. Cart becomes a bottom sheet below 640px, described in 15.1.
6. Filter chips become a scroll-snap strip with an edge fade, described in 12.
7. Best sellers rail: cards at 78vw below `sm`, arrows hidden on touch.
8. The `tex-tint` and `tex-glow` masked layers are disabled below 640px for
   performance, described in 6.
9. Never use `100vh`. Always `100dvh` or `min-h-[100dvh]`.
10. Every image carries `loading="lazy"` (except the first banner image, which is
    `loading="eager"` plus `fetchpriority="high"`), explicit `width` and `height` or
    a CSS `aspect-ratio`, so there is no layout shift.
11. All existing `responsiveImage()` calls stay.
12. Horizontal overflow at 320px width must be zero. Test it.
13. Respect `env(safe-area-inset-bottom)` on the sticky bar, the bottom sheet and
    the toast.

---

## 19. ACCEPTANCE CHECKLIST

The work is done when every line here passes. Check them in order.

**Build and tests**
- [ ] `npm run build` succeeds with no TypeScript errors.
- [ ] `npm run test:nav` passes against a running dev server.
- [ ] `node scripts/design-verify.mjs` passes. **Note:** this script asserts on the
      old film-grain overlay and hero parallax. Update its selectors to the new
      `.tex-grain` layer and the new banner rather than deleting the assertions.
- [ ] Zero occurrences of `pine`, `brass`, `clay`, `canvas`, `Fraunces`, `Manrope`
      anywhere in `src/`.
- [ ] Zero hardcoded `RM` strings in `src/`. All prices go through `formatPrice()`.

**Texture**
- [ ] No hexagon pattern is visible on top of any photograph, anywhere, at any
      breakpoint. Check the banner image, handpicked cards, category tiles, product
      cards and the product gallery.
- [ ] The hexagon texture IS visible on the page background, the banner copy panel
      and the footer.

**Animation**
- [ ] Scroll down past a section, then scroll back up. Every reveal animates again.
      Nothing animates only once.
- [ ] Both title plate counters tick up from 0 on every entry, not just the first.
- [ ] With `prefers-reduced-motion: reduce` set, nothing animates and everything is
      visible and readable.

**Best sellers**
- [ ] Complete a WhatsApp checkout, then query
      `select * from checkout_events order by created_at desc limit 5` in Supabase.
      Rows exist with the right product ids and quantities.
- [ ] `select * from best_sellers(7, 6)` returns rows.
- [ ] The rail renders those products in that order.
- [ ] With an empty `checkout_events` table, the rail falls back to newest products
      and does not error or render blank.
- [ ] There is no admin screen for best sellers.

**Content**
- [ ] The product page shows Benefits, Dos and cycle (for reference only), and Note,
      in that order, with placeholder text when empty.
- [ ] No Specifications table exists anywhere.
- [ ] The footer bottom bar shows only the copyright line. No address, no hours.
- [ ] Stock shows only green "Available Stock" or red "No Stock". No number appears
      next to stock anywhere.

**Commerce**
- [ ] "Add to cart" adds, animates and toasts, and opens nothing.
- [ ] "Buy now" adds and opens the checkout modal directly.
- [ ] Both are disabled for out-of-stock products.
- [ ] The cart still clears after the WhatsApp redirect.

**Admin**
- [ ] A banner with an eyebrow, two button labels and two URLs renders both buttons.
- [ ] A banner with `cta2_label` blank renders only one button.
- [ ] Toggling Handpicked on two products makes them appear in the home Handpicked
      section in `featured_order` order.
- [ ] Turning off Handpicked for all products hides the entire section including its
      title plate.

**Mobile**
- [ ] At 320px, 390px, 768px and 1024px there is no horizontal scrollbar.
- [ ] The sticky product bar appears on scroll and does not cover content.
- [ ] The cart opens as a bottom sheet below 640px.
- [ ] The Brands accordion expands brand, then categories.

**Accessibility**
- [ ] Escape closes the cart drawer and the checkout modal, and focus returns.
- [ ] Focus is trapped inside both while open.
- [ ] Every icon-only button has an `aria-label`.

---

## 20. THINGS THAT ARE EXPLICITLY OUT OF SCOPE

Do not do any of these, even if they seem like improvements:

- No payment gateway, no customer accounts, no order table beyond `checkout_events`.
- No stock quantity column and no "only N left" messaging.
- No serif typeface anywhere.
- No second accent colour. Blue only.
- No admin control over the best sellers rail.
- No changes to the WhatsApp message format in `src/lib/whatsapp.ts`.
- No React Query, SWR or any new state library.
- No server-side rendering migration.
- No em dash characters in any user-facing string. Use a normal hyphen or restructure
  the sentence.

---

## 21. SUGGESTED COMMIT SEQUENCE

Ship in these steps, building after each:

1. `chore: apply storefront v2 migration and update schema.sql`
2. `feat: swap design tokens and fonts to bricolage/geist palette`
3. `feat: add hexagon texture layers and gradient edge utility`
4. `feat: add TitlePlate, Toast, and replaying Reveal`
5. `feat: rebuild header with logo assets and two-level brand menu`
6. `feat: rebuild home banner carousel from banners table`
7. `feat: add handpicked section and category bento`
8. `feat: log checkout events and add best sellers rail`
9. `feat: restyle catalog with title plate, chips, sort and url sync`
10. `feat: restyle product page with benefits, dos and cycle, note`
11. `feat: buy now and add to cart semantics across cards and product page`
12. `feat: mobile bottom sheet cart, sticky product bar, accordion brand menu`
13. `feat: admin fields for new product and banner columns plus handpicked page`
14. `fix: accessibility, focus traps, escape handling, tap targets`
