# Frontend & UI/UX Handoff — WhatsApp Catalog Storefront

**Audience:** Claude (or any engineer) analysing this codebase to update the
**frontend and UI/UX**. Read this first, then use it as a map into the source.
Everything below mirrors the current state of the repo on the committed
branch (`fb32b44`). Read the actual files before editing.

- Stack: **React 19 + TypeScript + Vite 6 + Tailwind CSS 3 + Framer Motion 12 + React Router 7 + Supabase**
- Hosting: **Vercel** (SPA rewrite, `vercel.json`)
- Checkout channel: **WhatsApp Business** (wa.me deep link, no payments)
- Live: `https://catalog-site-chi.vercel.app` — admin at `/admin/login`

---

## 1. Product / business context (do not break this)

This is a **mobile-first WhatsApp commerce catalog**. The whole funnel is:

> Browse → category/product pages → add to basket (localStorage) → cart drawer
> → checkout modal (optional name + notes) → **wa.me link opens WhatsApp with a
> pre-filled order message** → cart is cleared.

Hard constraints that shape the UI:

1. **No customer accounts, no payments, no order DB.** WhatsApp is the
   checkout; the site converts interest into a message to the business number.
2. **Trust & reassurance copy matter.** Everywhere "no payment here, we confirm
   over chat" appears (product page, cart drawer, checkout modal) — preserve it.
3. **"In stock / No stock" is a live trust signal.** Products carry a
   `stock_status` (`available` | `no_stock`); UI must prevent adding/buying
   out-of-stock items (buttons disable, toastless copy flips to "Out of stock").
4. **`is_active` gates everything public.** The storefront only ever queries
   active products/banners; admin sees everything.
5. The entire shop is **readable by anyone** (indexable, by design); admin is
   `noindex` + session-gated.

---

## 2. Tech stack & versions (package.json)

| Concern | Choice |
| --- | --- |
| Framework | React `19.1`, `react-dom` |
| Language | TypeScript `5.8`, strict build (`tsc -b` in `npm run build`) |
| Bundler | Vite `6.3` (manual chunks: vendor / motion / supabase) |
| Styling | Tailwind `3.4` + PostCSS + autoprefixer |
| Motion | `framer-motion` `12.12` |
| Routing | `react-router-dom` `7.6` (`createBrowserRouter`) |
| Data | `@supabase/supabase-js` `2.49` (anon key, RLS-protected) |
| Utils | `clsx` + `tailwind-merge` (`cn()` helper) |
| Fonts | `@fontsource/fraunces` (display serif) + `@fontsource/manrope` (sans) |
| Scripts | `dev`, `build` (`tsc -b && vite build`), `preview`, `lint` (`tsc -b`), `generate:sitemap` |

**Build rules to respect:** `vite.config.ts` sets `sourcemap: false` (security
requirement — never re-enable in prod) and manual chunk splitting.

---

## 3. Repository map (where things live)

```
src/
  main.tsx                  Entry: fonts, CartProvider, <App/>
  App.tsx                   Router + lazy routes + Suspense + ErrorBoundary
  index.css                 Tailwind layers, body texture/grain, component classes
  lib/
    types.ts                All domain types (Category, Brand, Product, Banner, CartItem)
    supabase.ts             Client (anon key only), throws if misconfigured
    api.ts                  STOREFRONT reads (banners/categories/brands/products, search)
    adminApi.ts             ADMIN reads+writes (CRUD + reorder + storage upload)
    constants.ts            SITE_NAME, tagline, WhatsApp number, PRODUCTS_PER_PAGE qty
    utils.ts                cn(), slugify(), formatPrice(), clampPrice(), firstParam()
    whatsapp.ts             Order message builder + wa.me link
    image.ts                responsiveImage() — Supabase transform params
    seo.ts                  useSeo() hook, applySeo(), productJsonLd()
  hooks/
    useCart.tsx             Cart context + localStorage persistence
    useData.ts              useAsync + useBanners/Categories/Brands/Products/Product/Related
    useDebounce.ts          useDebounce(value, ms)
    useEffectOnce.ts        StrictMode-safe mount-once
  components/
    layout/  Header.tsx Footer.tsx Layout.tsx
    catalog/ ProductCard.tsx ProductGrid.tsx CategoryTile.tsx Facet.tsx
    cart/    CartDrawer.tsx FlyToCart.tsx
    checkout/CheckoutModal.tsx
    ui/      Button.tsx Icons.tsx Reveal.tsx Skeleton.tsx StockBadge.tsx
             QuantityStepper.tsx ErrorBoundary.tsx PageLoader.tsx
  pages/
    Home.tsx Catalog.tsx Category.tsx Brand.tsx Product.tsx Search.tsx NotFound.tsx
  admin/
    AdminLayout.tsx AdminLogin.tsx ProtectedRoute.tsx index.ts
    components/ Fields.tsx ImageDropzone.tsx
    pages/     Dashboard.tsx Products.tsx ProductForm.tsx Categories.tsx Brands.tsx Banners.tsx
supabase/
  schema.sql                Full schema + RLS + storage bucket + indexes
  seed.sql                  Demo data (categories/brands/products/banners)
  migrations/20260812_add_brands.sql   Additive brands migration (PENDING on live DB)
public/
  robots.txt sitemap.xml    SEO files
scripts/                    nav/settle/design verification + sitemap generator
```

---

## 4. Design system — read `tailwind.config.js` + `index.css` first

### 4.1 Colour palette ("warm cream + deep pine + brass")

Named tokens, no raw hex in components (always use the theme):

| Token | Hex | Role |
| --- | --- | --- |
| `canvas` | `#F6F2E9` | Page background (warm cream) |
| `canvas-deep` | `#EFE8DA` | Cards, wells, alternating bands |
| `ink` | `#191D19` | Text primary (near-black, slight green) |
| `ink-soft` | `#4B5249` | Secondary text |
| `ink-muted` | `#7C8378` | Tertiary / hints |
| `pine` | `#2F4A3C` | **Primary brand colour** (buttons, badges, active states) |
| `pine-dark` | `#22352B` | Hover |
| `pine-deep` | `#18251F` | Header/footer hero fills, dark surfaces |
| `pine-soft` | `#E6EDE6` | Tint backgrounds, "available" badge |
| `pine-line` | `#C8D4C6` | Borders |
| `brass` | `#B07D3F` | **Accent** — eyebrows, brand names, price emphasis |
| `brass-dark` | `#8F6330` | Accent hover |
| `brass-soft` | `#F1E5CE` | Accent tint |
| `clay` | `#A4402F` | **Danger / no-stock / errors** |
| `clay-soft` | `#F6E3DE` | Error tint |

Patterns to keep consistent:

- **Amenity pairing:** eyebrow labels are `brass`, primary interactive fills are
  `pine`, destructive is `clay`, page tone is `canvas`/`canvas-deep`.
- Prices: on cards muted small; on product page `font-display text-2xl text-pine`.
- Stock badge: green tint (`pine-soft`/`pine-dark`) = available, clay tint =
  no stock. Live dot + text, animated scale pulse on mount.

### 4.2 Typography

- **Display serif:** `Fraunces` (loads 400/500/600), used via `font-display` —
  headings, prices, big numbers, logo. `index.css` sets
  `font-variation-settings: 'opsz' 60` for optical sizing.
- **Sans:** `Manrope` (400/500/600/700), used via `font-sans` (default) — body,
  buttons, labels, inputs.
- **Eyebrow label:** `.eyebrow` — `text-[11px] font-semibold uppercase
  tracking-wide2 text-brass`. Section header pattern: eyebrow over a
  `font-display` heading.

### 4.3 Surface atmosphere (recent design-pass additions — keep)

`index.css` `@layer base` adds three deliberate textures — **do not remove
without conscious replacement:**

1. **Body gradient:** two soft radial glows + a vertical cream-to-parchment
   linear gradient (`background-attachment: fixed`) so large areas never read
   as one flat colour.
2. **Film grain overlay:** `body::after`, a fixed inline-SVG fractalNoise tiling
   at `opacity: 0.05`, `z-index: 10`, `pointer-events: none`. Sits above content
   but below sticky chrome/drawers (drawers are `z-50`+; header `z-40`).
3. **`tile-texture`:** layered warm gradient + grain for tiles *without* images
   (category tiles, etc.) so placeholders look designed, not empty.

### 4.4 Component-layer utilities (`@layer components` in index.css)

- `.container-site` — max-width `80rem`, responsive padding (site container).
- `.eyebrow`, `.display`, `.sr-only`.
- `.media-frame` — `rounded-2xl bg-pine-soft` image wrapper (product photos).
- `.section-band` — alternating "parchment" band for scroll rhythm on home /
  category pages; adjacent bands alternate with `bg-transparent`.
- `.tile-texture` — see above.
- `.font-display` optical-sizing nudge.

### 4.5 Shadows / spacing / radius tokens

- `shadow-card` and `shadow-lift` (soft layered) are the two elevation tiers.
- Buttons are `rounded-full`; cards/surfaces `rounded-2xl/3xl`; inputs
  `rounded-2xl`. Focus ring is `outline-2 outline-brass` on `:focus-visible`.
- Selection colour: `bg-brass/30 text-ink`.

---

## 5. Data model & Supabase (see `supabase/schema.sql`)

| Table | Columns (relevant) | RLS |
| --- | --- | --- |
| `categories` | id, name, slug (unique), image_url, sort_order | public read; admin write |
| `brands` | id, name, slug (unique), image_url, sort_order | public read; admin write |
| `products` | id, category_id*, brand_id*, name, slug (unique), description, price `numeric(12,2)`, stock_status (`available`/`no_stock`), is_active, images `text[]`, tags `text[]` | public read **only** `is_active = true`; admin write |
| `banners` | image_url, title, subtitle, link_url, sort_order, is_active | public read `is_active`; admin write |
| `profiles` | id → auth.users, role (`admin` only) | self-read only |
| Storage bucket | `product-images` (public) | public read; admin write via `is_admin()` |

- `updated_at` auto-maintained by `set_updated_at()` trigger.
- **RLS pattern:** every write is scoped `to authenticated` and gated by
  `public.is_admin()` (involer, locked `search_path`, execute granted only to
  `authenticated`). The client bundle ships only the **anon key** → storefront
  is read-only, period.
- **Brands are a pending additive migration** (see §11 "Known constraints").
  `schema.sql` already includes `brands`; the live DB still needs
  `supabase/migrations/20260812_add_brands.sql` run in the Supabase SQL editor
  before the brand filter + `/brand/*` pages can show data.

### Types (`src/lib/types.ts`)

- `Category { id, name, slug, image_url, sort_order }`
- `Brand { id, name, slug, image_url, sort_order }`
- `Product { id, category_id, brand_id, name, slug, description, price,
  stock_status, is_active, images[], tags[], categories?, brands? }` — the
  joined relations are populated from `api.ts` selects.
- `Banner { image_url, title, subtitle, link_url, sort_order, is_active }`
- `CartItem { product_id, name, slug, price, image, stock_status, qty }` (snapshot stored in localStorage — cart is a **denormalised snapshot**, updates only on re-add).

---

## 6. Routing (`src/App.tsx`)

Storefront under `StoreLayout` (all lazy-loaded with `PageLoader` fallback):

| Route | Page | Notes |
| --- | --- | --- |
| `/` | Home | hero carousel, new arrivals, categories |
| `/catalog` | Catalog | facets (category + brand), load-more grid |
| `/category/:slug` | Category | landing + brand facet + "explore more" |
| `/brand/:slug` | Brand | landing + category facet |
| `/product/:slug` | Product | gallery, qty, add-to-basket, related |
| `/search?q=` | Search | debounced-as-you-type, URL-synced, noindex |
| `*` | NotFound | branded 404 |

Admin (under `/admin`):

- `/admin/login` (`AdminLogin`) and everything else wrapped in `ProtectedRoute`.
- `index` → Dashboard; `/products`, `/products/new`, `/products/:id` (one
  form component handles new+edit), `/categories`, `/brands`, `/banners`.

Layout notes:

- The **retail chrome is `StoreLayout`** (`Layout.tsx`): Header + animated
  `<main>` + Footer + CartDrawer + CheckoutModal, wrapped in `FlyToCartProvider`.
- `AnimatedOutlet` is keyed by `location.pathname` → fade+rise on every route
  change, and **remounts routes** so data hooks refetch on each navigation
  (intentional; see its comment). `Search` is the exception — it keeps its own
  URL state so keystrokes don't remount (focus loss risk).
- `ScrollToTop` resets scroll on pathname change.
- No `AnimatePresence` around the outlet deliberately (documented in code).

---

## 7. Storefront pages — walkthrough & UI/UX state

All pages follow: `useSeo(...)` + data hooks + sectioned layout. Grid pattern
is `grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4`.

### 7.1 Home (`src/pages/Home.tsx`)

- **HeroCarousel:** auto-advances every 6s; parallax (image + scrim drift on
  scroll); slide swipe direction-aware (AnimatePresence popLayout); arrow
  buttons revealed on hover (always visible on mobile via `max-sm:opacity-100`);
  dot indicators (aria-current widening pill). Empty state = tasteful
  "Add a hero banner in the admin" panel. Banner CTA = light pill linking to
  `link_url` if set.
- **New arrivals:** `section-band`, 4 `ProductCard`s from newest (8 fetched), a
  "View all" ghost button to `/catalog`, wrapped in `Reveal`.
- **Shop by category:** 2/3/4-column grid of `CategoryTile`s.
- Per-message: uses `useSeo({ title: undefined, canonicalPath: '/' })`.

### 7.2 Catalog (`src/pages/Catalog.tsx`)

- **Sticky facet bar** (`sticky top-16 sm:top-20 z-30`, blurred canvas) with two
  `FacetRow`s: Category and Brand. Chips are `FacetChip` (pill, `aria-pressed`,
  active = pine fill). Brand row only renders chips if the brands table exists
  (capability check) — currently hidden until migration runs.
- Filter state is **local `useState`** seeded from `?category=`/`?brand=`
  search params (but doesn't write back to URL — a possible UX nit).
- Load-more pagination via `useProducts(category, undefined, 12, brand)` +
  `ProductGrid`'s "Load more products" button.
- Empty state: centered icon + "Nothing here yet" + back-home CTA.
- `useSeo({ title: 'All Products', canonicalPath: '/catalog' })`.

### 7.3 Category (`src/pages/Category.tsx`)

- Breadcrumb (`Home · Catalog · <name>`), optional cover image (`media-frame`
  hero with `Reveal`), heading, brand facet (if brands exist).
- Product grid + load more; empty state "No products in X yet"; **"Explore more
  categories"** section-band with remaining `CategoryTile`s (recent addition).
- SEO: title from category name, ogImage from category image.

### 7.4 Brand (`src/pages/Brand.tsx`)

- Mirror of Category but for a brand: breadcrumb, optional brand cover,
  heading + one-liner, **category facet**, products, empty state.
- SEO: `Shop {brand} at {SITE_NAME}`.

### 7.5 Product (`src/pages/Product.tsx`)

- **Loader:** skeleton layout. **Not found:** brand message + back link.
- **Gallery:** main `media-frame aspect-[4/5]` image, `AnimatePresence` crossfade
  on `activeImage`, StockBadge top-left, thumbnail strip (active = pine border).
  `responsiveImage()` used everywhere.
- **Info column:** category and brand as uppercase eyebrow *links*,
  `font-display` H1, price in pine + StockBadge, description
  (`whitespace-pre-line`), tag pills, `QuantityStepper` (min 1) + "Add to
  basket" (`Button`, disabled + copy "Out of stock" when no stock), and a
  **"Order this on WhatsApp"** primary-green button that adds to cart and opens
  the drawer (only when in stock).
- **Fly-to-cart:** `handleAdd` measures the main image and calls `fly()`.
- **Reassurance microcopy** under the CTAs ("Checkout happens over WhatsApp…
  no online payment") — keep.
- **Related:** same-category products, up to 4, "You might also like".
- SEO/JSON-LD: `useSeo({ ..., jsonLd: productJsonLd(...) })` — memo discussion
  in `seo.ts` docs.

### 7.6 Search (`src/pages/Search.tsx`)

- Sticky search input; `useDebounce(input, 350)`; two-way URL sync with a
  `wroteToUrl` ref to avoid fighting the header form (subtle — keep the logic
  intact when restyling).
- Result count line ("N results for 'x'"), grid, empty + idle states.
- `robots: 'noindex,follow'` (search results are not indexed).

### 7.7 NotFound

- Big serif "404", "This page took a holiday" tagline, pine CTA home. noindex.

---

## 8. Shared components (the building blocks — reuse, don't reinvent)

### Catalog
- **`ProductCard`** — `motion.article` (layout anim, scroll-in with `index`
  stagger, `once: true`), aspect 4/5 image in `media-frame` with hover zoom +
  `hover:shadow-lift`, brand eyebrow (brass), 2-line-clamped name, muted price,
  StockBadge, and a circular floating **add-to-cart button** (top-right,
  canvas/backdrop-blur → pine on hover) that animates a fly-to-cart. Disabled
  state when out of stock. *The `data-main-image`/`.product-card` hooks matter
  to fly-to-cart — don't rename casually.*
- **`ProductGrid`** — grid + skeleton switches + "Load more products" pill.
- **`CategoryTile`** — 4/5 image tile; if no image, `tile-texture` with giant
  monogram letter; gradient scrim + name + circular arrow chip.
- **`Facet`** — `FacetChip` (aria-pressed pill), `FacetRow` (brass label +
  horizontal scrollable chip row). No scroll-snap — an easy polish target.

### Layout
- **`Header`** — sticky, blurred canvas, `h-16 sm:h-20`; hamburger (mobile),
  `Logo` (wordmark — last word brass), desktop nav = category links + "All
  Products" (`NavLink`), search form (desktop inline, mobile toggle strip +
  full mobile menu accordion via AnimatePresence height). Cart button: pine
  circle with brass count badge (spring scale), `id={CART_TARGET_ID}` for
  fly-to-cart target. Closes menus on any navigation.
- **`Footer`** — `pine-deep` ("parchment-to-emerald" band), 4 columns: brand
  blurb, Shop links (categories), Contact (WhatsApp link via `whatsappLink`),
  Ordering note. Bottom bar copyright + "Prices subject to confirmation".

### Cart & checkout
- **`CartDrawer`** — right spring drawer (`z-50`, max-w-md), backdrop click to
  close, body scroll lock, empty state, item rows (thumb, name link, price,
  `QuantityStepper` sm, line total, trash), subtotal + "Checkout via WhatsApp"
  button (opens checkout + closes drawer). Item enter/exit list animations.
- **`FlyToCart`** — provider renders nothing visual except flying thumbnails
  (`z-[80]`): on `fly(from, image)` a thumbnail swoops to the cart target over
  ~750ms. `useFlyToCart()` used by ProductCard + Product page. Keeps a
  `CART_TARGET_ID` constant — do not change if both sides must match.
- **`CheckoutModal`** — 3-stage flow (`idle` → `completing` → `done`), appears
  as bottom-sheet on mobile / centered card on sm+. Order summary, optional
  name + notes, then Button opens WhatsApp (~450ms delayed so loading paints),
  clears cart, shows checkmark, auto-closes. Guards: requires configured number;
  closes itself if cart emptied while idle. **Cart is cleared on handoff.**

### UI primitives
- **`Button`** / **`LinkButton`** — variants `primary | outline | ghost |
  danger | whatsapp`; sizes `sm | md | lg`; rounded-full. `whatsapp` is the
  green `#1FA559`. Use `buttonClass()` for one-off anchors matching buttons.
- **`Icons`** — inline SVG set (cart, search, close, menu, chevrons, plus,
  minus, trash, whatsapp, image, arrow-right, upload, check, edit, logout, tag),
  24×24 viewBox, `strokeWidth 1.8`, aria-hidden by default.
- **`Reveal`** — scroll-triggered fade+rise, respects `prefers-reduced-motion`
  (renders statically). Used for section headers, tiles, category hero.
- **`Skeleton`** / **`ProductCardSkeleton`** / **`ProductGridSkeleton`** — pulse
  placeholders; admin `Skeleton` rows too.
- **`StockBadge`** — animated status pill (green/red), `layout` + scale pulse.
- **`QuantityStepper`** — pill with − / + , clamps 0–99, `sm|md` sizing, disabled
  states.
- **`ErrorBoundary`** — top-level crash fallback ("The page hit a snag",
  reload button, dev-only error message).
- **`PageLoader`** — lazy-chunk fallback (pulsing cart icon).

---

## 9. Data-fetching pattern (grok before touching pages)

- **`useData.ts`** wraps a tiny `useAsync` (cancelled-safe) and exports
  `useBanners`, `useCategories`, `useBrands`, `useProducts`, `useProduct`,
  `useRelatedProducts`. Every page uses these — **never call `api.ts`
  directly in a page** (keep one pattern).
- `useProducts(categorySlug?, search?, pageSize?, brandSlug?)` returns
  `{ data, count, loading, error, hasMore, loadMore }` (+ internally resets the
  page when filters change).
- **`api.ts`** — pure reads; `price` is `numeric` in Postgres so every row is
  hydrated via `hydrateProduct(Number(price))`. Search uses PostgREST `or()` /
  `ilike` / `tags.cs.{term}` with a sanitised term (strips characters that would
  break the filter) and, when brands exist, also matches brand name.
- **Brand capability flag** (`ensureBrandsCapability` in `api.ts` AND
  `adminApi.ts`): one probe per session; if the `brands` table is absent the
  selects omit the join and brand features quietly no-op. See §11.

---

## 10. Admin (functional, toggles & one-screen forms)

Same design language (fonts/colours/radii), but utilitarian: sidebar
(`AdminLayout`) with nav (Dashboard / Products / Categories / Brands / Banners),
"View store ↗", Sign out. noindex everywhere.

- **Dashboard** — three stat cards (products/categories/brands) + "Add a product".
- **Products** — list rows (thumb, name + Live/Hidden pill, price · brand ·
  category, StockBadge, edit/delete). Delete uses `window.confirm`.
- **ProductForm** — single-screen form: Details (name+auto-slug, slug, price,
  category, brand, description, tags), Photos (`ImageDropzone`, first = cover,
  uploads to Supabase storage w/ cleanup of replaced files), Status (two
  Toggles: stock status, visibility). Save navs back to list.
- **Categories / Brands** — near-identical CRUD + up/down reorder (persisted
  via `reorder*Admin` upsert). New/edit inline panels with name + slug (auto
  from name) + image URL field.
- **Banners** — list with image preview, up/down reorder (per-item upsert), add/
  edit panel (`BannerFormFields`: image URL, title, subtitle, link URL,
  active toggle).
- **Fields.tsx** — `Field` (label+hint), `inputClass`, `Toggle`
  (role="switch", animated knob). Reuse these for any new admin fields.

---

## 11. Known constraints, pending items & sharp edges (read before changing)

1. **Brand migration NOT yet applied to the live DB.** Until someone runs
   `supabase/migrations/20260812_add_brands.sql` in the Supabase **SQL editor**,
   the frontend hides brand facets and `/brand/*` pages render but return
   nothing. The capability probe is the "on switch". Any UI work on brands is
   gated on this. (Note: anon-key clients cannot run DDL — it must be done in
   the dashboard.)
2. **Cart is a snapshot.** `CartItem` stores name/price/image at add-time; if
   the admin edits a product the cart shows stale values until re-added. No
   fix shipping — but UI shouldn't imply live prices in the cart.
3. **`formatPrice()`** uses `Intl.NumberFormat('en-US', …)` + optional
   `VITE_CURRENCY_LABEL` prefix. Works but en-US locale is hardcoded.
4. **Catalog facets read `?category=&brand=` only on mount** (local state) —
   the URL isn't updated when chips change. Deep-linking works one-way.
5. **`robots.txt` + `public/sitemap.xml` contain `https://example.com`**
   placeholders (SITE_URL env is used only at build/sitemap-gen time). Run
   `npm run generate:sitemap` and fix robots.txt before launch.
6. **Accessibility:** good foundations (aria-pressed, aria-expanded, roles,
   focus rings, sr-only, reduced-motion). Notable gaps worth upgrading:
   - No `<dialog>` semantics; drawers/modals are `role="dialog"`/`aria-modal`
     but **no focus trap or Escape-key close on the drawer** (checkout modal
     gains Escape only if added; currently neither has explicit key handling).
   - Hero carousel has no pause-on-hover / keyboard prev-next buttons are
     `opacity-0` until hover on desktop (still focusable but invisible).
   - Facet rows overflow horizontally without scroll-snap or gradient affordance.
7. **Fly-to-cart & product-card CSS-coupling:** `ProductCard` discovers its
   `<img>` via `.product-card` class; Product page uses `[data-main-image]`.
   Renaming either breaks the animation silently.
8. **No toast system** — out-of-stock / already-added feedback is silent or via
   `window.confirm`/`window.alert` in admin. A common UX request.
9. **Admin deletes confirm via native dialogs**; no undo, no soft-delete.
10. **`index.html` hardcodes "Ray BodyLab"** meta/og — fine as default but not
    env-driven (SITE_NAME drives runtime `<title>` via `seo.ts`).
11. **Vercel env vars must be set** for the live deploy to have Supabase +
    WhatsApp configured; the preview deploys from GitHub (connected repo).

---

## 12. Current visual language & taste (what the design pass aimed for)

Recent work (commit `fb32b44`, "Design pass") intentionally steered the UI to:

- **Warm, editorial, "physical goods" feel** — cream parchment backgrounds,
  serif display type, brass accents, subtle grain. *Avoid* generic gradient-
  button SaaS aesthetics; this brand is warm/earthy.
- **Depth without busyness** — layered shadows (`card`/`lift`), soft radial
  glows, one restrained accent colour (brass) plus a trustworthy green (pine)
  and a single danger red (clay).
- **Micro-interaction polish** — route fade, scroll reveals, card hover zoom,
  flying-to-cart thumbnails, spring cart badges, animated stock badge.
- **Mobile-first** — 2-col grids on phones, sticky blurred facets/search,
  bottom-sheet checkout, full-tap targets.
- **Emptiness is designed** — every empty state (no category image, no banner,
  no products, no search results) has a considered visual, not a grey box.

When proposing UI/UX changes, **respect the tokens** (no new raw hex), the
radii/shadow vocabulary, `font-display`/Manrope usage, and the reassurance
microcopy — and preserve the RLS/data-layer separation.

---

## 13. Suggested areas worth a UI/UX pass (candidates, not decisions)

1. **Cart/checkout accessibility** — Escape-to-close + focus trap for drawer &
   modal; focus return to the trigger.
2. **Toast/inline feedback** — e.g. "Added to basket" confirmation (the drawer
   doesn't open on quick adds today, only the fly animation).
3. **Facet bar polish in Catalog** — scroll-snap/snapping, gradient edge fade,
   multi-select option, stable URL sync (write `?category=`/`?brand=` back).
4. **Hero carousel a11y** — pause control, keyboard visible arrows, `aria-live`.
5. **Search page** — keep the URL logic; polish empty/idle states and add a
   "clear search" affordance inside the input.
6. **Responsive checkout** — confirm the sm+ card/bottom-sheet behaviour is
   intentional and tested on short viewports (`max-h-[92dvh]`).
7. **Admin experiences** — replace native confirm/alert with styled inline
   confirmations; consider draft/status badges and image reordering in the
   dropzone (currently first-uploaded = cover, no drag reorder).
8. **Performance** — fine already (manual chunks), but watch `framer-motion`
   `layout` animations on large grids and large image grids
   (`responsiveImage` params help).
9. **Empty states** — already strong; keep them when touching grids.

---

## 14. Source-of-truth files to open first

| To understand… | Open |
| --- | --- |
| Design tokens | `tailwind.config.js`, `src/index.css` |
| Types | `src/lib/types.ts` |
| Storefront reads | `src/lib/api.ts`, `src/hooks/useData.ts` |
| Cart/checkout flow | `src/hooks/useCart.tsx`, `src/components/cart/CartDrawer.tsx`, `src/components/checkout/CheckoutModal.tsx`, `src/lib/whatsapp.ts` |
| Routing & layout | `src/App.tsx`, `src/components/layout/Layout.tsx` |
| Page patterns | `src/pages/Home.tsx`, `src/pages/Product.tsx` |
| Components library | `src/components/ui/*`, `src/components/catalog/*` |
| Admin patterns | `src/admin/pages/ProductForm.tsx`, `src/admin/pages/Brands.tsx` |
| Schema/RLS | `supabase/schema.sql`, `supabase/migrations/20260812_add_brands.sql` |

Build/type-check: `npm run build` (tsc + vite). Local: `npm run dev`.