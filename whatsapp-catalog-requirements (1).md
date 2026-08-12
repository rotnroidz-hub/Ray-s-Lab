# Project Brief: WhatsApp Catalog E-Commerce Site

## 1. Summary

A production-ready product catalog website where customers browse products, add
them to a cart, and check out by being redirected to WhatsApp Business with a
pre-filled order summary. **There is no payment gateway and no order database
on the customer side** — WhatsApp is the checkout and negotiation channel.

The site must be **mobile-first** (majority of traffic is mobile) but fully
usable on desktop, feel premium and modern (not a generic template), and be
built with privacy/security hardening baked in from day one (see Section 8).

## 2. Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS (+ Framer Motion for animations)
- **Backend/DB/Auth/Storage:** Supabase (Postgres, Auth, Storage)
- **Hosting:** Vercel
- **No payment SDK, no order-processing backend** — checkout is a `wa.me` deep link

## 3. Public-Facing Pages & Features

### 3.1 Home Page
- Logo in header/nav
- Hero banner (image carousel — configurable from admin, not hardcoded)
- Featured categories and/or featured products section
- Clear CTA into the catalog

### 3.2 Product Catalog
- Grid view of products, filterable by category
- Pagination or infinite scroll
- Product card: image, name, price, **stock status badge** (green "Available
  Stock" / red "No Stock" — see Section 4 for how this is set), quick "add to cart"

### 3.3 Categories
- Category navigation (header/menu)
- Category landing page listing that category's products

### 3.4 Search
- Keyword search input (sticky/accessible on mobile)
- Matches product name, description, and tags
- Debounced-as-you-type or dedicated results page
- Clear empty-state ("no results for X")

### 3.5 Product Details Page
- Image gallery
- Name, description, price, **stock status badge** (green "Available Stock" / red "No Stock")
- Quantity selector + add to cart
- SEO meta tags unique per product
- Optional: related products from same category

### 3.6 Shopping Cart
- Cart persists across page reloads (localStorage — no customer accounts)
- Add / remove items, adjust quantity inline
- Cart drawer or sidebar accessible from any page
- Running subtotal

### 3.7 WhatsApp Checkout
- "Checkout via WhatsApp" button generates a formatted text order summary:
  item names, quantities, unit price, line totals, grand total
- Optional lightweight pre-checkout form (customer name / notes) merged into the message
- Opens `https://wa.me/<BUSINESS_NUMBER>?text=<url-encoded summary>`
- Decide and implement one of: clear cart on redirect, or keep cart until customer confirms

## 4. Admin Dashboard

- **Auth:** Supabase Auth, email + password. No public sign-up — admin
  account(s) created directly in the Supabase dashboard, not through the site.
- Login lives at an unlisted route (e.g. `/admin/login`) — not in the public
  nav, not in the sitemap, `noindex` meta tag.
- Protected route wrapper: unauthenticated visitors are redirected away from
  any `/admin/*` route.
- **Product management:** a single product form with every field on one
  screen — name, **description** (text area), price, category, one or more
  **images** (drag-and-drop upload to Supabase Storage), and a **stock
  status toggle**. Create, edit, and delete all happen from this same form —
  there's no separate screen needed for images/description/stock, they're
  all part of the one product record.
- **Stock status toggle (customer-facing):** a simple two-state switch you
  set manually per product — no quantity tracking at all. Set to
  **"Available Stock"** → storefront shows a **green "Available Stock"**
  badge. Set to **"No Stock"** → storefront shows a **red "No Stock"**
  badge. This appears wherever the product is shown (catalog grid and
  product page), and defaults to "Available Stock" when you first create
  a product.
- **Category management:** create/edit/delete, reorder.
- *(Optional, decide later)*: a "quote requests" log that snapshots the cart
  before the WhatsApp redirect, purely for your own reference — not required
  for checkout to work.

## 5. Data Model (Supabase / Postgres)

```sql
categories
  id            uuid pk
  name          text
  slug          text unique
  image_url     text
  sort_order    int

products
  id                 uuid pk
  category_id        uuid fk -> categories.id
  name               text
  slug               text unique
  description        text
  price              numeric
  stock_status       text default 'available'  -- 'available' | 'no_stock'
  is_active          boolean default true
  images             text[]        -- Supabase Storage URLs
  tags               text[]
  created_at         timestamptz
  updated_at         timestamptz

profiles (optional, only if you'll add more than one admin later)
  id      uuid pk -> references auth.users.id
  role    text     -- 'admin'
```

**Row Level Security:**
- `categories`, `products`: public `select` only where `is_active = true`
- All `insert` / `update` / `delete`: restricted to authenticated admin role
- Storage bucket for product images: public read, authenticated-admin write

## 6. Design Requirements

- Mobile-first responsive layout; test on small screens first, then scale up
- Premium, distinctive visual identity — a deliberately chosen typography
  pairing and color palette (not Tailwind's default palette used as-is),
  generous whitespace, and a look that doesn't read as a templated
  component-library site
- Micro-animations, applied purposefully rather than decoratively:
  - Add-to-cart: item animates toward the cart icon with a quantity-bump effect
  - Cart drawer: smooth slide-in/out with a backdrop fade
  - Stock badge: smooth color transition when status flips green/red
  - Banner carousel: smooth auto-advancing transitions, swipeable on mobile
  - Hover/press states on cards and buttons (scale, shadow, or color shift)
  - Page/route transitions (fade or slide) instead of hard page jumps
  - Skeleton loading states instead of blank screens while data loads
- Performance: lazy-loaded and responsive images, optimized bundle size —
  animations should stay lightweight and never degrade mobile performance

## 7. SEO

- Unique `<title>` / meta description per product and category page
- Clean URL slugs: `/product/<slug>`, `/category/<slug>`
- `sitemap.xml` and `robots.txt`
- Product structured data (schema.org `Product`) on product pages
- **Note the tradeoff:** full SEO indexing means Google will index and surface
  your storefront publicly — see Section 8 if you'd rather stay lower-profile
  and decide deliberately (e.g. index the storefront but `noindex` admin routes,
  which is the recommended middle ground).

## 8. Security & Privacy Requirements

Two real concerns here, addressed honestly — one is fully solvable, one has a
hard technical limit that's worth understanding rather than papering over.

### 8.1 Keeping hosting/identity untraceable
- [ ] Deploy on Vercel's standard shared infrastructure (not a dedicated VPS)
      — there is no personal server IP tied to you for someone to find
- [ ] Register the domain through a registrar with free WHOIS privacy
      (Cloudflare Registrar, Namecheap, etc.) so your name/address aren't public
- [ ] Use one dedicated business email (not your personal one) for the domain,
      Vercel account, Supabase account, and GitHub account
- [ ] **Keep the GitHub repo private.** This is the single biggest identity leak
      if skipped — a public repo shows commit history, author names/emails, and
      often personal comments
- [ ] No real name in `package.json` `author` field, no personal email in code
      comments, no personal social links anywhere in the codebase
- [ ] Use GitHub's private "noreply" email for commit authorship
- [ ] Disable source maps in the production build (`build.sourcemap: false` in
      Vite) so readable source and stack traces aren't shipped to visitors

### 8.2 Preventing code/data tampering
Being direct about the limit: any HTML/CSS/JS that runs in a customer's
browser is downloadable and viewable by design — no minification or
obfuscation changes that, because the browser has to be able to read it to
run it. What's fully protectable is your **data and admin functions**, not
the visible front-end code:
- [ ] Never ship the Supabase **service role key** to the client — only the
      public **anon key**, and only with tight RLS policies (Section 5) — so
      even a fully-read client bundle grants no write access
- [ ] Admin routes require real Supabase session auth, not just being unlisted
- [ ] Production build is minified/tree-shaken (Vite default) — raises the
      effort to read, doesn't prevent it, and shouldn't be relied on alone
- [ ] Rate-limit and validate everything server-side (RLS / Supabase Edge
      Functions) — never trust input from the client

## 9. Deployment

- Vercel project linked to the **private** GitHub repo
- Environment variables in Vercel: Supabase URL + anon key only —
  service role key must never be a client-exposed env var
- Custom domain, WHOIS-privacy-protected, connected via Vercel

## 10. Explicitly Out of Scope

- Payment gateway / online payment processing
- Customer accounts or login
- Order database / order management beyond the optional quote-log
- Shipping/delivery logistics inside the app (handled manually over WhatsApp)

## 11. Nice-to-Haves (later, not v1)

- Multiple admin roles/permissions
- Low-stock email/notification alerts
- Privacy-respecting analytics (Vercel Analytics or self-hosted Plausible)
