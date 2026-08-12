# WhatsApp Catalog Storefront

A production-ready, mobile-first product catalog: customers browse products, add
them to a basket, and check out by being redirected to **WhatsApp Business**
with a pre-filled order summary. No payment gateway, no customer accounts, no
order database on the customer side — WhatsApp is the checkout channel.

Built on **React + TypeScript + Vite + Tailwind CSS + Framer Motion + Supabase**,
hosted on **Vercel**.

---

## Quick start

```bash
npm install
cp .env.example .env        # then fill in the real values
npm run dev
```

The storefront runs at `http://localhost:5173`, admin login at
`http://localhost:5173/admin/login`.

### Environment variables

| Variable                   | Purpose                                                            |
| -------------------------- | ------------------------------------------------------------------ |
| `VITE_SITE_NAME`           | Brand name shown in the header/footer and `<title>` suffix         |
| `VITE_SUPABASE_URL`        | Supabase project URL (Settings → API)                              |
| `VITE_SUPABASE_ANON_KEY`   | Supabase **anon** key — never the service_role key (see Security)  |
| `VITE_WHATSAPP_NUMBER`     | Business number in international format, digits only, e.g. `15551234567` |
| `VITE_WHATSAPP_INTRO`      | Opening line of the WhatsApp order message                         |
| `VITE_SITE_URL`            | Deployed origin for canonical URLs + sitemap, no trailing slash    |
| `VITE_CURRENCY`            | ISO 4217 code used for price formatting (default `USD`)            |
| `VITE_CURRENCY_LABEL`      | Optional symbol shown before prices                                 |

## Setting up Supabase (one time)

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → paste and run [`supabase/schema.sql`](supabase/schema.sql)** —
   this creates `categories`, `products`, `banners`, `profiles`, the storage
   bucket, triggers, indexes and **all Row Level Security policies**.
3. Optionally run [`supabase/seed.sql`](supabase/seed.sql) for demo data.
4. **Create the admin account** (no public sign-up exists):
   - Auth → Users → *Add user* → email + password (create a strong one).
   - Insert the admin profile row so RLS grants write access:
     ```sql
     insert into public.profiles (id, role)
     select id, 'admin' from auth.users where email = 'admin@example.com';
     ```
5. Confirm the `product-images` storage bucket was created with public read +
   admin write policies (schema.sql does this automatically).
6. Copy `VITE_SUPABASE_URL` and the **anon** key into `.env`.

## Features map (from the requirements doc)

| Requirement | Where |
| --- | --- |
| Home: logo, hero carousel, featured, CTA | `src/pages/Home.tsx`, banners managed in admin |
| Catalog grid + category filter + load-more | `src/pages/Catalog.tsx` |
| Category landing pages | `src/pages/Category.tsx` |
| Debounced search (name/description/tags) | `src/pages/Search.tsx` |
| Product page: gallery, qty, stock badge, SEO/JSON-LD | `src/pages/Product.tsx` |
| localStorage cart + drawer | `src/hooks/useCart.tsx`, `src/components/cart/CartDrawer.tsx` |
| WhatsApp checkout w/ name/notes + clear-on-redirect | `src/components/checkout/CheckoutModal.tsx` |
| Admin login (unlisted, noindex) | `src/admin/AdminLogin.tsx` |
| Protected `/admin/*` routes | `src/admin/ProtectedRoute.tsx` |
| One-screen product form (all fields + drag-drop images + stock toggle) | `src/admin/pages/ProductForm.tsx` |
| Category management + reorder | `src/admin/pages/Categories.tsx` |
| Banner management + reorder | `src/admin/pages/Banners.tsx` |
| RLS schema | `supabase/schema.sql` |

**Design decision:** the cart is **cleared on WhatsApp redirect** — once the
order is handed to WhatsApp the customer starts fresh next time.

## SEO

- Per-page `<title>`/meta/canonical via `src/lib/seo.ts`; unique slugs
  `/product/<slug>`, `/category/<slug>`.
- schema.org `Product` JSON-LD injected on product pages.
- `public/robots.txt` disallows `/admin` and `/search`.
- `public/sitemap.xml` covers static routes. Regenerate it after catalog
  changes: `npm run generate:sitemap`.
- **Tradeoff to decide deliberately (Section 7):** the storefront *is* publicly
  indexable by design. If you want a lower profile, add `<meta name="robots"
  content="noindex">` to the storefront layout and remove `robots.txt`'s
  `Allow`. The recommended middle ground (storefront indexed, admin not) is
  what ships by default.

## Security & privacy hardening (Section 8)

Implemented in this repo:

- **Only the anon key ships to the browser.** All writes are gated by RLS
  `public.is_admin()` policies, so a fully-read client bundle grants zero write
  access. The service_role key never appears in the client.
- **RLS on every table** (see `supabase/schema.sql`): public `select` only on
  active products; all inserts/updates/deletes require the admin role.
- **Source maps disabled** (`build.sourcemap: false` in `vite.config.ts`).
- **Admin routes require a real Supabase session** — unlisted URL alone is not
  enough (React Router `ProtectedRoute` + server-side RLS).
- **Admin area is `noindex`.**

Things to do yourself before launch:

- Keep the GitHub repo **private** (biggest identity leak if skipped).
- Use a **dedicated business email** for domain/Vercel/Supabase/GitHub.
- Register the domain with free **WHOIS privacy** (Cloudflare Registrar etc.).
- Use GitHub's private **noreply email** for commits; no personal name/email in
  `package.json`, comments, or social links in the codebase.
- Set `VITE_*` env vars in **Vercel** (never commit real values).
- Understand the limit from 8.2: client JS is readable by design; protection is
  for your data and admin functions, not the HTML/CSS/JS itself.

## Deployment (Section 9)

1. Push to a **private** GitHub repo.
2. Import into Vercel → framework preset **Vite** (it auto-detects).
3. Add env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_WHATSAPP_NUMBER`, `VITE_SITE_NAME`, `VITE_SITE_URL`,
   `VITE_CURRENCY` (never a service_role key).
4. `vercel.json` ships an SPA rewrite so deep links work.
5. Point your WHOIS-privacy-protected domain at Vercel.

## Out of scope (deliberately)

Payments, customer accounts, order databases/management, and shipping
logistics — all handled manually over WhatsApp.
