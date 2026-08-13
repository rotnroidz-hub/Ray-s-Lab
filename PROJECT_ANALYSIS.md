# PROJECT_ANALYSIS.md — Full Technical Analysis

**Complete analysis of the WhatsApp Catalog Storefront** for Claude (or any engineer)
working on this project. Covers architecture, stack, codebase, database, security,
deployment, and the current UI/UX state. Everything reflects the committed state
(`fb32b44`) of the repo. Read the cited files before editing; this doc is a map,
not a substitute.

- **Repo:** `C:\Users\user\catalog-site` — git, remote `rotnroidz-hub/Ray-s-Lab`
- **Live:** `https://catalog-site-chi.vercel.app` (Vercel production)
- **Admin:** `https://catalog-site-chi.vercel.app/admin/login`

---

## Table of contents

1. [Product overview & business model](#1-product-overview--business-model)
2. [Architecture overview](#2-architecture-overview)
3. [Technology stack](#3-technology-stack)
4. [Repository layout](#4-repository-layout)
5. [Build tooling & config](#5-build-tooling--config)
6. [Database (Supabase / PostgreSQL)](#6-database-supabase--postgresql)
7. [Data access layer](#7-data-access-layer)
8. [Application structure & routing](#8-application-structure--routing)
9. [State management](#9-state-management)
10. [Design system](#10-design-system)
11. [Storefront pages](#11-storefront-pages)
12. [Shared components](#12-shared-components)
13. [Admin area](#13-admin-area)
14. [Cart & WhatsApp checkout flow](#14-cart--whatsapp-checkout-flow)
15. [SEO strategy](#15-seo-strategy)
16. [Security model](#16-security-model)
17. [Scripts & verification tooling](#17-scripts--verification-tooling)
18. [Deployment (Vercel)](#18-deployment-vercel)
19. [Environment variables](#19-environment-variables)
20. [Known constraints & sharp edges](#20-known-constraints--sharp-edges)
21. [Suggested improvements (any layer)](#21-suggested-improvements-any-layer)
22. [Reading order / source-of-truth files](#22-reading-order--source-of-truth-files)

---

## 1. Product overview & business model

A **mobile-first WhatsApp commerce catalog**. A small business showcases products;
customers browse, build a basket, and place the order by sending a pre-filled
message to the business's **WhatsApp Business** number. There is **no payment
gateway, no customer accounts, and no order database** on the customer side —
WhatsApp *is* the checkout channel, and the merchant confirms price/availability/
delivery in chat.

Core funnel:

```
Browse (home/catalog/category/brand/search)
  → Product page (gallery, qty, stock badge)
  → "Add to basket" (localStorage cart, fly-to-cart animation)
  → Cart drawer → "Checkout via WhatsApp"
  → Checkout modal (optional name + notes)
  → wa.me link opens WhatsApp with a formatted order message
  → cart is CLEARED on redirect (deliberate design decision)
```

Hard product constraints that the UI must honour:

1. No payment / accounts / order DB — the site's job is converting interest into a
   WhatsApp message.
2. **Stock status is a live trust signal** — `stock_status = available | no_stock`;
   out-of-stock items cannot be added to the cart.
3. **`is_active` gates everything public** — storefront queries filter it everywhere;
   admin can see hidden records.
4. Storefront is publicly indexable by design; admin is `noindex` + session-gated.
5. Reassurance microcopy ("no payment taken here", "we confirm over chat") appears
   on the product page, cart drawer, and checkout modal — keep it.

---

## 2. Architecture overview

```
┌────────────────────────────────────────────────────────────┐
│  Browser (SPA — React 19, Vite build)                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Storefront (anon key)            Admin (auth session)  │ │
│  │ pages/ → components/ → hooks/ →  admin/ pages          │ │
│  │ lib/ (api.ts, adminApi.ts, seo.ts, whatsapp.ts, ...)   │ │
│  └───────────────────────┬────────────────────────────────┘ │
│                          │ supabase-js (REST, RLS)          │
└──────────────────────────┼─────────────────────────────────┘
                           ▼
        ┌────────────────────────────────────┐
        │ Supabase (Postgres + Auth + Storage)│
        │ tables: categories, brands,         │
        │ products, banners, profiles         │
        │ Row Level Security on every table   │
        │ bucket: product-images (public)     │
        └────────────────────────────────────┘
                           ▲
        WhatsApp Business (wa.me deep links from the client)
```

- **Client-side rendering (SPA)** hosted on Vercel; `vercel.json` rewrites all
  routes to `index.html` so deep links work.
- **Supabase is the only backend** — used for data (Postgres), auth (admin
  sessions), and file storage (product/banner images). No custom server.
- **Checkout is external** — a `wa.me` deep link with an encoded order text.
- **Three client capabilities via a single anon key:**
  1. Public read (RLS allows reading active products / all categories & brands /
     live banners).
  2. Admin write (only after the user signs in with a Supabase session whose
     `profiles.role = 'admin'`; RLS evaluates `is_admin()` for every write).
  3. Anonymous storefront is strictly read-only — the shipped bundle can never
     write because RLS rejects it.

---

## 3. Technology stack

| Concern | Technology | Version | Notes |
| --- | --- | --- | --- |
| Framework | React | 19.1 | function components + hooks only |
| Language | TypeScript | 5.8 | strict mode, `verbatimModuleSyntax`, `noUnusedLocals/Parameters` |
| Bundler | Vite | 6.3 | manual chunks (vendor/motion/supabase), `sourcemap: false` |
| Styling | Tailwind CSS | 3.4 | custom token palette, `@layer` component classes |
| Motion | framer-motion | 12.12 | route transitions, reveals, fly-to-cart, badges |
| Routing | react-router-dom | 7.6 | `createBrowserRouter` + lazy routes |
| Backend/Database | Supabase | — | Postgres + RLS + Auth + Storage |
| Client SDK | @supabase/supabase-js | 2.49 | anon key only |
| Fonts | Fraunces + Manrope | 5.2 | self-hosted via @fontsource |
| Helpers | clsx, tailwind-merge | 2.1 / 3.3 | `cn()` util |
| Platform | Vercel | — | SPA hosting, git-connected auto-deploys |
| Fonts served | @fontsource | — | bundled, no external font CDN |

**npm scripts** (`package.json`):
- `npm run dev` → Vite dev server (port 5173)
- `npm run build` → `tsc -b && vite build` (type-check then bundle)
- `npm run preview` → serve the built `dist/`
- `npm run lint` → `tsc -b` (type-check only)
- `npm run generate:sitemap` → rebuild `public/sitemap.xml` from DB
- `npm run test:nav` → headless Edge navigation smoke test

---

## 4. Repository layout

```
catalog-site/
├─ .env / .env.example          env (never commit .env)
├─ .gitignore                   excludes .env, dist, .vercel, logs
├─ package.json                 scripts + deps
├─ tsconfig.json                solution-style references
├─ tsconfig.app.json            browser code (src)
├─ tsconfig.node.json           tooling (vite.config, scripts)
├─ vite.config.ts               React plugin, chunk split, no sourcemaps
├─ tailwind.config.js           design tokens
├─ postcss.config.js            tailwind + autoprefixer
├─ vercel.json                  SPA rewrite
├─ index.html                   HTML shell + static OG/meta + favicon
├─ README.md                    setup + ops guide
├─ UIUX_ANALYSIS_HANDOFF.md     UI/UX-focused handoff (this doc is the superset)
├─ dev.log                      local dev log (gitignored)
├─ dist/                        build output (gitignored)
├─ node_modules/                deps (gitignored)
├─ public/
│  ├─ robots.txt                disallow /admin, /search
│  └─ sitemap.xml               regenerated by script (currently placeholder domain)
├─ scripts/
│  ├─ check-db.mjs              DB connectivity + row dump
│  ├─ check-search.mjs          search-filter behaviour probes
│  ├─ design-verify.mjs         headless Edge: SEO tags + brandless-DB resilience
│  ├─ generate-sitemap.mjs      sitemap generator
│  ├─ nav-preview-test.mjs      nav smoke test (preview server)
│  ├─ nav-settle-test.mjs       nav/data-settle test
│  └─ nav-test.mjs              nav smoke test (dev server)
├─ src/
│  ├─ main.tsx                  entry: fonts, CartProvider, App
│  ├─ App.tsx                   router + lazy routes + ErrorBoundary
│  ├─ index.css                 Tailwind layers, textures, component classes
│  ├─ vite-env.d.ts
│  ├─ lib/                      domain: types, api, adminApi, supabase, seo,
│  │                            whatsapp, constants, utils, image
│  ├─ hooks/                    useCart, useData, useDebounce, useEffectOnce
│  ├─ components/
│  │  ├─ layout/                Header, Footer, Layout
│  │  ├─ catalog/               ProductCard, ProductGrid, CategoryTile, Facet
│  │  ├─ cart/                  CartDrawer, FlyToCart
│  │  ├─ checkout/              CheckoutModal
│  │  └─ ui/                    Button, Icons, Reveal, Skeleton, StockBadge,
│  │                            QuantityStepper, ErrorBoundary, PageLoader
│  ├─ pages/                    Home, Catalog, Category, Brand, Product, Search,
│  │                            NotFound
│  └─ admin/
│     ├─ AdminLayout.tsx        sidebar shell
│     ├─ AdminLogin.tsx         email+password sign-in
│     ├─ ProtectedRoute.tsx     session gate for /admin/*
│     ├─ index.ts               barrel
│     ├─ components/            Fields (Field/Toggle/inputClass), ImageDropzone
│     └─ pages/                 Dashboard, Products, ProductForm, Categories,
│                               Brands, Banners
└─ supabase/
   ├─ schema.sql                full schema + RLS + storage + indexes
   ├─ seed.sql                  demo data
   └─ migrations/
      └─ 20260812_add_brands.sql  additive brands migration (PENDING on live DB)
```

---

## 5. Build tooling & config

**`vite.config.ts`:**
- React plugin.
- `build.sourcemap: false` — **security requirement, never re-enable**.
- `chunkSizeWarningLimit: 900`.
- `manualChunks`: `vendor` (react, react-dom, react-router-dom), `motion`
  (framer-motion), `supabase` (@supabase/supabase-js). Predictable caching.

**`tsconfig`:** strict TS with two project references (`tsconfig.app.json` for
`src/`, `tsconfig.node.json` for `vite.config.ts` + `scripts/`). App target ES2022,
`jsx: react-jsx`, `noEmit` (type-check only — Vite does the emit).

**`index.html`:** HTML shell. Inline SVG favicon (pine rounded square + 👋).
Static `theme-color`, description, OG/Twitter meta and title hardcode **"Ray
BodyLab"** (env-independent; runtime titles come from `seo.ts` using
`VITE_SITE_NAME`).

---

## 6. Database (Supabase / PostgreSQL)

### 6.1 Schema (`supabase/schema.sql`)

| Table | Columns | Notes |
| --- | --- | --- |
| `categories` | id uuid PK, name, slug **unique**, image_url, sort_order, created_at, updated_at | storefront nav + landing pages |
| `brands` | id uuid PK, name, slug **unique**, image_url, sort_order, created_at, updated_at | additive migration, see §6.4 |
| `products` | id uuid PK, category_id FK→categories, brand_id FK→brands, name, slug **unique**, description, price `numeric(12,2)`, stock_status `check in ('available','no_stock')`, is_active bool, images `text[]`, tags `text[]`, created_at, updated_at | both FKs `on delete set null` |
| `banners` | image_url, title, subtitle, link_url, sort_order, is_active | home hero carousel |
| `profiles` | id uuid PK → auth.users (cascade), role `check (role = 'admin')`, created_at | admin flag, no public sign-up |
| storage `product-images` | public bucket | public read; admin write/delete |

- `set_updated_at()` trigger auto-maintains `updated_at` on all four content tables.
- **Indexes:** products(category_id), products(brand_id), products(slug),
  categories(slug), brands(slug).
- **Price is stored as `numeric(12,2)`** — PostgREST returns it as a string, so
  every read hydrates via `Number(price)` (see `hydrateProduct` in `api.ts`).

### 6.2 Row Level Security (the security backbone)

`public.is_admin()` — SECURITY INVOKER, `search_path = ''`, reads only the caller's
own `profiles` row:
```sql
select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
```
- **Public read:** categories, brands (all rows); products (`is_active = true`);
  banners (`is_active = true`). Anonymous storefront can read.
- **Admin write:** all content tables scoped `to authenticated` with
  `using (is_admin())` + `with check (is_admin())`.
- **Storage:** public select on `product-images` bucket; insert/update/delete gated
  on `is_admin()`.
- `is_admin()` EXECUTE is revoked from `public`/`anon` and granted to
  `authenticated` — so anon never even evaluates it (avoids a failure on reads).

**Consequence:** the shipped browser bundle (anon key) is strictly read-only for
the storefront; only an admin session can write, and only if their profile row says
`admin`.

### 6.3 Seed data (`supabase/seed.sql`)

Demo: 3 categories (Audio, Wearables, Accessories), 4 brands (JBL, Sony, Garmin,
Anker), 6 products (Aria headphones, Pulse speaker, Ridge watch [no_stock], Trail
Runner band, Voyage backpack, Arc lamp), 2 banners. Images are Unsplash URLs
(external — not in storage, so `responsiveImage()` passes them through untouched).

### 6.4 Brands migration status — IMPORTANT

- `schema.sql` already defines `brands` + `products.brand_id` (kept in sync).
- The **live Supabase project may not have run the migration yet**. The additive
  migration file `supabase/migrations/20260812_add_brands.sql` must be executed in
  the Supabase SQL editor (anon-key clients **cannot** run DDL).
- The frontend **capability-probes** once per session (`ensureBrandsCapability` in
  `api.ts` and `adminApi.ts`): if `brands` is missing, selects omit the brand join
  and all brand UI quietly hides (facet rows, `/brand` pages return empty). Brand
  features "turn on" automatically after the migration + seed.

---

## 7. Data access layer

### 7.1 Storefront reads — `src/lib/api.ts`

Public functions (all `async`, throw `Error(message)` on Supabase error):
- `fetchBanners()`, `fetchCategories()`, `fetchBrands()` — full table, ordered by
  `sort_order`.
- `fetchProducts({ categorySlug, brandSlug, search, page, pageSize, featured })`
  — paginated (`range(from, to)`), `is_active = true`, ordered `created_at desc`.
  - category/brand resolved by slug→id first (so the filter is a single FK eq).
  - **search:** PostgREST `or()` over `name.ilike`, `description.ilike`,
    `tags.cs.{term}`, plus brand name when brands exist. The term is sanitised
    (strips `%_{}()&,.!` and collapses spaces) because those break `ilike`/array
    literals. `featured` limits to 8.
  - count returned via `{ count: 'exact' }`.
- `fetchProductBySlug(slug)` — single active product + joins.
- `fetchRelatedProducts(product, limit=4)` — same category, exclude self.
- `fetchProductsByIds(ids)` — `in()` filter.

Select string is dynamic: `'*, categories(id, name, slug)'` or `'*, categories(id,
name, slug), brands(id, name, slug)'` depending on `brandsCapable`.

### 7.2 Admin data — `src/lib/adminApi.ts`

CRUD + reorder for products, categories, brands, banners; image upload:
- `uploadProductImage(file)` → storage path `products/<ts>-<rand>.<ext>`,
  `cacheControl: 3600`, returns public URL.
- `deleteProductImage(path)` and `storagePathFromUrl(url)` — parse the public URL
  back to a path so replaced images can be cleaned up.
- Reorder is implemented as `upsert({ id, sort_order })` per list.

### 7.3 Data hooks — `src/hooks/useData.ts`

- `useAsync(fn, deps, initial)` — cancelled-safe fetch wrapper exposing
  `{ data, loading, error }`.
- `useBanners / useCategories / useBrands` — one-shot lists.
- `useProducts(categorySlug?, search?, pageSize?, brandSlug?)` →
  `{ data, count, loading, error, hasMore, loadMore }`; resets page when the
  query key changes; accumulates pages as the user loads more.
- `useProduct(slug)`, `useRelatedProducts(product)`.

**Convention:** pages never call `api.ts` directly — always through these hooks.

### 7.4 Supabase client — `src/lib/supabase.ts`

- Reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`; **throws at module load** if
  missing (fail fast).
- Only the anon key ships. `persistSession: true`, `autoRefreshToken: true`.
- `export type { Session }`.

---

## 8. Application structure & routing

**`src/main.tsx`** imports the four Fraunces + four Manrope weights, wraps the app in
`CartProvider` + `StrictMode`, renders `<App />`.

**`src/App.tsx`** — `createBrowserRouter` with two route groups:

- **Storefront** (`StoreLayout`):
  - `/` Home · `/catalog` Catalog · `/category/:slug` Category ·
    `/brand/:slug` Brand · `/product/:slug` Product · `/search` Search · `*` NotFound.
- **Admin** (`AdminLayout`): `/admin/login` (public), everything else under
  `ProtectedRoute`:
  - `/admin` Dashboard · `/admin/products` · `/admin/products/new` ·
    `/admin/products/:id` · `/admin/categories` · `/admin/brands` ·
    `/admin/banners`.

All route components are **lazy-loaded** with `withSuspense(<PageLoader />)`
fallback. Top-level `ErrorBoundary` wraps the `RouterProvider`.

**`src/components/layout/Layout.tsx`** (StoreLayout):
- `FlyToCartProvider` wraps everything (fly-to-cart animation needs to be global).
- `ScrollToTop` — instant scroll reset on pathname change.
- `AnimatedOutlet` — `motion.main` keyed by `pathname`, fade + 10px rise
  (`0.35s`, ease `[0.22,1,0.36,1]`). Keyed remount ensures every navigation
  refetches page data (deliberate — see code comment). **No AnimatePresence**
  around the outlet (documented reason: stale outlet issues).
- Then Header, Footer, CartDrawer, CheckoutModal.

---

## 9. State management

No Redux/Zustand. State is:

1. **React Context** — `CartProvider` (`src/hooks/useCart.tsx`): the only global
   store. Cart items + drawer/checkout open flags. Persists to `localStorage`
   (`wc-cart-v1`) on every change except the first mount. Exposes
   `items, itemCount (unique products), totalQty, subtotal, isOpen, openCart,
   closeCart, addItem, setQty, removeItem, clear, isCheckoutOpen, openCheckout,
   closeCheckout`. qty clamps 0–99. `addItem` merges by `product_id`.
2. **FlyToCartContext** (`FlyToCart.tsx`) — fires the thumbnail animation.
3. **Server state** — local `useState` in `useData` hooks per page (no cache
   library; each page fetch is independent). Note: `useCategories` is called
   independently by Header, Footer, Home, Catalog, Category, Brand — meaning
   repeated fetches; acceptable at this scale, worth knowing.
4. **URL search params** — Catalog seeds filters from `?category=`/`?brand=`;
   Search keeps `?q=` fully two-way synced.

---

## 10. Design system

### 10.1 Tokens (`tailwind.config.js`)

| Token | Value | Role |
| --- | --- | --- |
| `canvas` / `canvas-deep` | `#F6F2E9` / `#EFE8DA` | page bg / card-well bg |
| `ink` / `ink-soft` / `ink-muted` | `#191D19` / `#4B5249` / `#7C8378` | text tiers |
| `pine` / `pine-dark` / `pine-deep` | `#2F4A3C` / `#22352B` / `#18251F` | **primary**, hover, deep surfaces |
| `pine-soft` / `pine-line` | `#E6EDE6` / `#C8D4C6` | tints / borders |
| `brass` / `brass-dark` / `brass-soft` | `#B07D3F` / `#8F6330` / `#F1E5CE` | **accent** (eyebrows, brand names) |
| `clay` / `clay-soft` | `#A4402F` / `#F6E3DE` | danger / no-stock / errors |

- Fonts: `font-display` = Fraunces (serif) for headings/prices/logo;
  `font-sans` = Manrope for body/UI.
- Shadows: `card` (subtle) and `lift` (stronger) — the two elevation tiers.
- Radii: buttons `rounded-full`, cards `rounded-2xl/3xl`, inputs `rounded-2xl`.
- Focus: `:focus-visible` → `outline-2 outline-brass`. Selection: brass tint.

### 10.2 Atmosphere layers (`src/index.css`)

- **Body gradient:** two radial glows + vertical cream→parchment linear gradient,
  `background-attachment: fixed` — large areas never look flat.
- **Film grain:** `body::after` — fixed fractalNoise SVG at `opacity: 0.05`,
  `z-index: 10`, `pointer-events: none`. Above content, below sticky chrome
  (header `z-40`, drawers `z-50`, fly-layer `z-[80]`).
- **`tile-texture`:** warm gradient + grain for image-less tiles (category tiles
  fall back to a large serif monogram over this).
- **Component classes:** `.container-site` (max-w-80rem + padding),
  `.eyebrow` (brass small-caps label), `.display`, `.media-frame` (image frame),
  `.section-band` (alternating parchment bands), `.sr-only`.

### 10.3 Motion language

- Route change: fade + rise (Layout).
- Scroll reveal: `Reveal` (fade/slide once, respects `prefers-reduced-motion`).
- Cards: scroll-in with per-index stagger, hover image zoom + lift shadow.
- Fly-to-cart thumbnail swoop (750ms, ease `[0.22,1,0.36,1]`).
- Cart badge: spring pop on qty change.
- Stock badge: layout pulse on mount.
- Header mobile menu / search strip / drawers: height or x spring transitions.

---

## 11. Storefront pages

Grid pattern everywhere: `grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4`.
All pages call `useSeo(...)`.

### 11.1 Home (`src/pages/Home.tsx`)
- **HeroCarousel:** auto-advance 6s, parallax (image + scrim y-drift via
  `useScroll`/`useTransform`), swipe direction-aware slide transitions
  (AnimatePresence popLayout), hover-reveal arrows (always visible on mobile),
  dot indicators with `aria-current`, gradient scrim, optional CTA pill from
  `banner.link_url`. Empty state: "Add a hero banner in the admin" panel.
- **New arrivals:** `section-band`, 4 newest products via `useProducts(_,_,8)`,
  "View all" ghost link → `/catalog`.
- **Shop by category:** `CategoryTile` grid.
- SEO: `useSeo({ canonicalPath: '/' })` → "Ray BodyLab | tagline".

### 11.2 Catalog (`src/pages/Catalog.tsx`)
- Sticky facet bar (`sticky top-16 sm:top-20 z-30`, blurred canvas) with two
  `FacetRow`s: **Category** + **Brand**. `FacetChip` pills (`aria-pressed`; active
  = pine fill). Brand row is hidden pre-migration (capability flag).
- Filter state is local `useState` seeded from `?category=`/`?brand=` (URL not
  written back — one-way deep link).
- `useProducts(category, undefined, 12, brand)` + `ProductGrid` load-more.
- Empty state: centered icon + "Nothing here yet" + back-home CTA.
- SEO title "All Products".

### 11.3 Category (`src/pages/Category.tsx`)
- Breadcrumb (Home · Catalog · name), optional cover image in `media-frame` with
  `Reveal`, heading, **brand facet**, product grid + load-more.
- "Explore more categories" `section-band` with remaining `CategoryTile`s.
- Empty states for missing category / no products. SEO + ogImage from category.

### 11.4 Brand (`src/pages/Brand.tsx`)
- Mirror of Category: breadcrumb, optional brand cover, heading + one-liner,
  **category facet**, product grid, empty state. SEO `Shop {brand} at {SITE_NAME}`.

### 11.5 Product (`src/pages/Product.tsx`)
- Loading skeleton; not-found state with back link.
- **Gallery:** `media-frame aspect-[4/5]` main image, AnimatePresence crossfade on
  thumbnail click, StockBadge top-left, horizontal thumbnail strip (active =
  pine border). `responsiveImage()` everywhere.
- **Info:** category & brand as uppercase eyebrow links, `font-display` H1, pine
  price + StockBadge, `whitespace-pre-line` description, tag pills,
  `QuantityStepper` (min 1) + **"Add to basket"** (disabled + "Out of stock" when
  unavailable), **"Order this on WhatsApp"** (adds to cart + opens drawer; only
  when in stock). Fly-to-cart from the main image (`data-main-image`).
- Reassurance microcopy under CTAs.
- **Related:** same-category products "You might also like" (up to 4).
- SEO + schema.org `Product` JSON-LD (`productJsonLd`).

### 11.6 Search (`src/pages/Search.tsx`)
- Sticky input; `useDebounce(350ms)`; two-way URL sync via `wroteToUrl` ref
  (prevents the header form fighting user typing — keep the logic intact when
  restyling). Result count line, grid, empty + idle states.
- `robots: noindex,follow`. Search matches name/description/tags/brand.

### 11.7 NotFound
- Big serif "404", "This page took a holiday", pine CTA home, noindex.

---

## 12. Shared components

- **UI:** `Button`/`LinkButton` (variants primary/outline/ghost/danger/whatsapp,
  sizes sm/md/lg, `buttonClass()` helper), `Icons` (inline SVG stroke set),
  `Reveal` (a11y-aware scroll reveal), `Skeleton`/`ProductCardSkeleton`/
  `ProductGridSkeleton`, `StockBadge` (animated availability pill),
  `QuantityStepper` (0–99 clamp, sm/md), `ErrorBoundary` (crash fallback),
  `PageLoader` (lazy-route fallback).
- **Catalog:** `ProductCard` (image card + floating add-to-cart that triggers
  fly-to-cart; `.product-card` class + `<img>` are used by the animation — don't
  rename), `ProductGrid` (grid + skeletons + load-more pill), `CategoryTile`
  (image tile or monogram+texture fallback), `Facet` (`FacetChip`/`FacetRow`).
- **Layout:** `Header` (sticky blurred, logo wordmark last-word-brass, desktop
  category nav, mobile menu + search accordions, pine cart button with brass badge
  `id=wc-cart-target`), `Footer` (pine-deep, 4 columns, WhatsApp contact link).
- **Cart:** `CartDrawer` (right spring drawer, scroll lock, item rows with
  QuantityStepper, subtotal, WhatsApp checkout CTA), `FlyToCart` (global provider,
  flying thumbnails `z-[80]`, `useFlyToCart()`).
- **Checkout:** `CheckoutModal` (idle → completing → done; bottom-sheet on mobile,
  centered card on sm+; opens WhatsApp ~450ms after send, clears cart, shows
  check, auto-closes ~1.5s; self-closes if cart empties while idle).
- **Admin:** `Fields` (`Field`, `inputClass`, `Toggle` switch),
  `ImageDropzone` (drag-drop + click, multi-upload, cover badge, delete + storage
  cleanup).

---

## 13. Admin area

- **`AdminLayout`:** sidebar (Dashboard/Products/Categories/Brands/Banners), "View
  store ↗", Sign out; mobile = top nav bar. `noindex,follow` SEO.
- **`ProtectedRoute`:** checks `supabase.auth.getSession()` + subscribes to
  auth changes; redirects guests to `/admin/login` with `state.from`. Loading =
  pulse icon.
- **`AdminLogin`:** email+password via `signInWithPassword`; redirects to
  `state.from` or `/admin/products`; error message on failure; `noindex`.
- **Dashboard:** 3 stat cards (products/categories/brands counts) + "Add a
  product" card.
- **Products:** list rows (thumb, name + Live/Hidden pill, price · brand ·
  category, StockBadge, edit/delete), native `confirm` on delete, "New product"
  button.
- **ProductForm:** one-screen form — Details (name + auto-slug until touched,
  slug, price, category, brand, description, tags), Photos (`ImageDropzone`),
  Status (stock + visibility Toggles). Create/update/delete → navigates back.
- **Categories / Brands:** near-identical CRUD, inline add/edit panels (name,
  slug auto-from-name, image URL), up/down reorder persisted via upsert.
- **Banners:** list with 21:9 preview, reorder, add/edit panel (image URL
  required, title, subtitle, link URL, active toggle).

Admin styling reuses the storefront tokens (same fonts/radii/colours) but is
deliberately utilitarian.

---

## 14. Cart & WhatsApp checkout flow

1. Add from ProductCard (qty 1) or Product page (chosen qty). `useCart.addItem`
   snapshots `{ product_id, name, slug, price, image, stock_status, qty }`.
   Out-of-stock items are blocked at the button (`disabled`).
2. Fly-to-cart thumbnail animates to the header cart icon.
3. `CartDrawer` shows items, qty controls, subtotal; "Checkout via WhatsApp"
   → `openCheckout()` + `closeCart()`.
4. `CheckoutModal` (idle): order summary, optional name + notes form.
5. On send: `buildCartMessage(items, name, notes)` builds the text
   (`whatsapp.ts`):
   - intro line (`WHATSAPP_INTRO`), optional `Name:`, blank line,
     `• Name ×qty / price x qty = line total`, `Total:`,
     optional `Notes:`, footer `— sent from <origin>`.
   - `whatsappLink()` → `https://wa.me/<VITE_WHATSAPP_NUMBER>?text=<encoded>`.
6. `wa.me` opens in a new tab (~450ms delay so the spinner paints), **cart is
   cleared**, stage → done (check icon), auto-close after 1.5s.
7. If `VITE_WHATSAPP_NUMBER` is missing, the modal shows a config warning and
   disables send.

**Deliberate:** the cart is cleared on WhatsApp redirect — the customer starts
fresh next time.

---

## 15. SEO strategy (`src/lib/seo.ts`)

- `useSeo({ title, description, canonicalPath, robots, ogImage, jsonLd })` —
  per-page effect that writes `<title>`, meta description, canonical,
  robots, OG/Twitter tags, and (optionally) replaces `#route-jsonld`.
- Title convention: home = `SITE_NAME | tagline`; subpages = `Page | SITE_NAME`.
- Product pages inject schema.org `Product` JSON-LD (name, description, image,
  sku, Offer with currency/price/InStock-OutOfStock).
- `robots.txt` disallows `/admin` and `/search`; sitemap includes static +
  DB-driven URLs via `npm run generate:sitemap` (needs `VITE_SITE_URL`).
- **Gotcha:** `public/robots.txt` and the current `public/sitemap.xml` still
  reference `https://example.com` — fix before launch.

---

## 16. Security model

1. **Only the anon key ships** — the service_role key never appears in the bundle.
2. **RLS on every table** — public read limited to active rows; all writes
   `to authenticated` + `is_admin()`.
3. **No public sign-up** — admin accounts are created manually in Supabase Auth +
   a `profiles` row.
4. **Sourcemaps disabled** in production builds.
5. **Admin `noindex`** + session-gated routes (client-side gate *and* server-side
   RLS — the client gate alone is not sufficient, but RLS enforces it).
6. `.gitignore` excludes `.env`; real secrets only in Vercel env vars.
7. Storage bucket is public for images (needed for rendering) but writes are
   admin-only.

---

## 17. Scripts & verification tooling

Node scripts under `scripts/` (see `scripts/` §4):

- `check-db.mjs` — raw Supabase probe of all four tables + active products.
- `check-search.mjs` — exercises the `or(ilike/tags.cs)` search filter against
  terms, incl. error-shape checks.
- `generate-sitemap.mjs` — reads `.env`, fetches products/categories/brands,
  writes `public/sitemap.xml`.
- `nav-test.mjs`, `nav-preview-test.mjs`, `nav-settle-test.mjs` — **headless
  Edge (CDP)** navigation smoke tests: warm home, category→category and
  product→product param changes (staleness check), rapid double navigation,
  transient-blank detection, skeleton counts, console error collection. They
  expect a local dev (`:5173`) or preview (`:4173`) server running, and Edge at
  the default install path (override via `EDGE` env).
- `design-verify.mjs` — headless check of SEO head tags, film-grain overlay,
  hero parallax, category product rendering, "Explore more categories",
  brandless-DB resilience (brand page must not crash, catalog Brand facet must
  collapse to "All"), product page SEO.

These were used during the recent design pass; keep them green when changing UI.

---

## 18. Deployment (Vercel)

- **Git-connected:** pushes to GitHub `main` (`rotnroidz-hub/Ray-s-Lab`) trigger
  auto-deploys to the linked project `ray-lab1/catalog-site`.
- **Framework preset:** Vite (auto-detected; build `npm run build`, output
  `dist`). Build runs `tsc -b && vite build` → failing types fail the build.
- **`vercel.json`:** SPA rewrite `/(.*) → /index.html` so deep links work.
- **Production URL:** `https://catalog-site-chi.vercel.app` (aliased).
- **Env vars must be set in Vercel:** the same `VITE_*` set used locally.
- Images stored in Supabase Storage (not on Vercel).

---

## 19. Environment variables (`.env.example`)

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | **anon** key only (never service_role) |
| `VITE_SITE_NAME` | Brand name (header, footer, `<title>` suffix) — default "Ray BodyLab" |
| `VITE_SITE_TAGLINE` | Home `<title>`/OG tagline |
| `VITE_WHATSAPP_NUMBER` | Business number, intl format digits-only (no `+`) |
| `VITE_WHATSAPP_INTRO` | First line of the WhatsApp order message |
| `VITE_SITE_URL` | Deployed origin for canonicals + sitemap (no trailing slash) |
| `VITE_CURRENCY` | ISO 4217 code for `formatPrice` (default USD) |
| `VITE_CURRENCY_LABEL` | Optional prefix symbol shown before prices |

`constants.ts` reads these with fallbacks; `utils.formatPrice()` uses
`Intl.NumberFormat('en-US', …)` with `VITE_CURRENCY` and the label prefix.

---

## 20. Known constraints & sharp edges

1. **Brand migration pending on live DB** (§6.4) — until
   `20260812_add_brands.sql` runs in the Supabase SQL editor, brand features are
   silently disabled. Also note the migration seeds demo brands; the live DB may
   want the seed block or manual admin entry.
2. **Cart is a denormalised snapshot** — names/prices/images are frozen at
   add-time; admin edits won't propagate until the item is re-added.
3. **`formatPrice` hardcodes `en-US`** locale + optional label; currency symbol
   handling is a bit heuristic.
4. **Catalog facets don't write back to the URL** (only read on mount).
5. **`robots.txt` / `sitemap.xml` still reference `example.com`** — fix + rerun
   sitemap before launch.
6. **Accessibility gaps:** drawer & checkout modal lack focus traps and Escape
   close; hero carousel arrows are invisible (though focusable) on desktop until
   hover; facet rows overflow without scroll-snap affordance.
7. **No toast/feedback system** — "added" feedback is only the fly animation;
   admin uses native `confirm`/`alert`.
8. **Admin delete is permanent**, no undo/soft-delete.
9. **`index.html` hardcodes "Ray BodyLab"** for static OG/meta (env-independent),
   though runtime `<title>` is env-driven.
10. **Repeated `useCategories` fetches** (Header, Footer, Home, Catalog, …) — no
    shared cache; fine at scale, worth caching if product counts grow.
11. **Lazy routes + Suspense:** navigation between lazy pages shows `PageLoader`;
    the keyed `AnimatedOutlet` remount ensures fresh data but also refetches on
    every route swap.

---

## 21. Suggested improvements (any layer)

**UX / interaction**
- Focus trap + Escape-to-close + focus return for CartDrawer and CheckoutModal.
- Add a lightweight toast ("Added to basket") or auto-open drawer on quick adds.
- Hero carousel: pause on hover/focus, visible keyboard arrows, `aria-live`.
- Catalog facets: scroll-snap, gradient edge fade, and write filters back to the
  URL (`?category=&brand=`) for shareable links.
- Search: "clear search" affordance inside the input.

**Data / performance**
- Consider a shared data cache (e.g. React Query/SWR) to dedupe repeated
  `useCategories` fetches and add stale-while-revalidate on product lists.
- If the catalog grows, add server-side sort/facet counts or a dedicated search
  (PostgREST `ilike` is fine for small catalogs).

**Admin UX**
- Replace native confirm/alert with styled inline confirmations.
- Image reordering in `ImageDropzone` (currently first-uploaded = cover).
- Row counts already exist on Dashboard; consider low-stock / inactive counts.

**Content / ops**
- Fix `example.com` in robots/sitemap; wire sitemap generation into CI/Vercel
  build if products change often.
- Run the brands migration and seed, then re-verify the brand facet + `/brand/*`.

---

## 22. Reading order / source-of-truth files

| To understand… | Open |
| --- | --- |
| Whole system | `README.md`, `package.json`, `vite.config.ts` |
| Design tokens | `tailwind.config.js`, `src/index.css` |
| Domain types | `src/lib/types.ts` |
| Storefront reads | `src/lib/api.ts`, `src/hooks/useData.ts` |
| Admin data | `src/lib/adminApi.ts` |
| Schema & RLS | `supabase/schema.sql`, `supabase/migrations/20260812_add_brands.sql`, `supabase/seed.sql` |
| Routing & layout | `src/App.tsx`, `src/components/layout/Layout.tsx` |
| Cart / checkout | `src/hooks/useCart.tsx`, `src/lib/whatsapp.ts`, `src/components/cart/CartDrawer.tsx`, `src/components/checkout/CheckoutModal.tsx` |
| Page patterns | `src/pages/Home.tsx`, `src/pages/Product.tsx`, `src/pages/Search.tsx` |
| UI components | `src/components/ui/*`, `src/components/catalog/*` |
| Admin patterns | `src/admin/pages/ProductForm.tsx`, `src/admin/pages/Brands.tsx` |
| SEO | `src/lib/seo.ts`, `public/robots.txt`, `public/sitemap.xml` |
| Verification | `scripts/*.mjs` |

Build/type-check: `npm run build` · Local dev: `npm run dev` · Nav smoke:
`npm run test:nav` (needs dev server).
