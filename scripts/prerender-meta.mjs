// Prerender per-route static HTML for dist/ so crawlers that never run
// JavaScript (WhatsApp, social scrapers) see the meta tags the SPA injects
// at runtime through src/lib/seo.ts.
//
// Run AFTER `vite build` (wired into `npm run build`): reads dist/index.html
// as the template, queries Supabase for the same route set
// generate-sitemap.mjs emits, and writes dist/<route>.html — e.g.
// dist/product/100-whey-gold-standard-optimum-nutrition.html. Cloudflare Pages
// serves `<route>.html` at the extensionless `<route>` with a 200; a
// dist/<route>/index.html layout would instead 308-redirect every hit to the
// trailing-slash form, adding a hop before our slash-free canonical/JSON-LD
// URLs. Top-level (catalog.html) and nested files both work the same way.
//
// dist/index.html itself is never written: it stays the homepage.
//
// Usage:  node scripts/prerender-meta.mjs

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { fetchActiveCatalog, loadEnv } from './lib/catalog.mjs'

const env = loadEnv()
const siteUrl = (env.VITE_SITE_URL || '').replace(/\/$/, '')
const supabaseUrl = env.VITE_SUPABASE_URL
const anonKey = env.VITE_SUPABASE_ANON_KEY

const missing = [
  !siteUrl && 'VITE_SITE_URL',
  !supabaseUrl && 'VITE_SUPABASE_URL',
  !anonKey && 'VITE_SUPABASE_ANON_KEY',
].filter(Boolean)

if (missing.length > 0) {
  console.error(`Missing required environment variable(s): ${missing.join(', ')}`)
  console.error('Set them in .env (locally) or in the build environment (CI).')
  process.exit(1)
}

// --- mirrors of src/lib/seo.ts + src/lib/constants.ts (keep in sync) ---
const SITE_NAME = env.VITE_SITE_NAME || 'Ray BodyLab'
const SITE_TAGLINE = env.VITE_SITE_TAGLINE || 'Whey Protein, Creatine & Supplements'
const DEFAULT_DESCRIPTION =
  'Browse whey protein, creatine, zinc and more from Optimum Nutrition, Myprotein and other popular brands. Pick your products and order via WhatsApp.'

const TEMPLATE = 'dist/index.html'
if (!existsSync(TEMPLATE)) {
  console.error(`${TEMPLATE} not found — run \`vite build\` before prerender-meta.`)
  process.exit(1)
}
const template = readFileSync(TEMPLATE, 'utf8')

// Site-wide og:image fallback for routes without their own image.
const DEFAULT_OG_PATH = existsSync(join('dist', 'og-default.png'))
  ? '/og-default.png'
  : '/logo-mark.png'

/** `&` first, then the rest — product names contain % and &. */
function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Replace a tag if the template has it, otherwise insert before </head>.
 * The replacement is always passed as a function so `$&`-style sequences in
 * user content (prices, descriptions) are never interpreted.
 */
function setTag(html, regex, replacement) {
  if (regex.test(html)) return html.replace(regex, replacement)
  return html.replace('</head>', () => `  ${replacement()}\n  </head>`)
}

function setTitle(html, text) {
  return setTag(html, /<title>[\s\S]*?<\/title>/, () => `<title>${esc(text)}</title>`)
}

function setMeta(html, attr, key, content) {
  const regex = new RegExp(`<meta\\s+[^>]*?${attr}="${key}"[^>]*>`)
  return setTag(html, regex, () => `<meta ${attr}="${key}" content="${esc(content)}" />`)
}

function setCanonical(html, href) {
  return setTag(html, /<link\s+rel="canonical"[^>]*>/, () => `<link rel="canonical" href="${esc(href)}" />`)
}

/** og:image must be absolute; DB values may be relative storage paths. */
function absoluteUrl(value) {
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  return siteUrl + (value.startsWith('/') ? value : `/${value}`)
}

/**
 * Tags written for every route — mirrors applySeo() in src/lib/seo.ts:48.
 * twitter:title/twitter:description are intentionally not added (applySeo
 * writes them, but scrapers use og:*, and they were not in the spec).
 */
function render(route) {
  const documentTitle = route.title ? `${route.title} | ${SITE_NAME}` : `${SITE_NAME} | ${SITE_TAGLINE}`
  const description = route.description || DEFAULT_DESCRIPTION
  const canonical = `${siteUrl}${route.path}`

  let html = template
  html = setTitle(html, documentTitle)
  html = setMeta(html, 'name', 'description', description)
  html = setMeta(html, 'property', 'og:site_name', SITE_NAME)
  html = setMeta(html, 'property', 'og:type', 'website')
  html = setMeta(html, 'property', 'og:locale', 'en_US')
  html = setMeta(html, 'property', 'og:title', documentTitle)
  html = setMeta(html, 'property', 'og:description', description)
  html = setMeta(html, 'property', 'og:url', canonical)
  html = setMeta(html, 'name', 'twitter:card', 'summary_large_image')
  // Never empty/null: route image, else the site-wide default.
  html = setMeta(html, 'property', 'og:image', absoluteUrl(route.image) || `${siteUrl}${DEFAULT_OG_PATH}`)
  html = setCanonical(html, canonical)
  return html
}

const supabase = createClient(supabaseUrl, anonKey)

async function main() {
  const { error, products, categories, brands } = await fetchActiveCatalog(supabase, {
    product: 'slug, name, description, images, category_id, brand_id',
    category: 'id, slug, name, image_url',
    brand: 'id, slug, name, image_url',
  })
  if (error) {
    console.error(`Supabase query failed: ${error.message}`)
    process.exit(1)
  }

  const defaultOg = `${siteUrl}${DEFAULT_OG_PATH}`

  const routes = [
    {
      path: '/catalog',
      title: 'All Products',
      description: 'Browse the full catalog. Every product, filterable by category and brand.',
      image: defaultOg,
    },
    ...categories.map((c) => ({
      path: `/category/${c.slug}`,
      title: c.name,
      description: `Browse our ${c.name} range and order over WhatsApp.`,
      image: c.image_url || defaultOg,
    })),
    ...brands.map((b) => ({
      path: `/brand/${b.slug}`,
      title: `${b.name} products`,
      description: `Shop ${b.name} at ${SITE_NAME}. Browse the range and order over WhatsApp.`,
      image: b.image_url || defaultOg,
    })),
    ...products.map((p) => ({
      path: `/product/${p.slug}`,
      title: p.name,
      // seo.ts:96 — Product.tsx passes description?.slice(0, 160).
      description: (p.description ? p.description.slice(0, 160) : '') || DEFAULT_DESCRIPTION,
      // seo.ts:68 — first image; site-wide default when the product has none.
      image: absoluteUrl(p.images?.[0]) || defaultOg,
    })),
  ]

  const counts = { catalog: 0, category: 0, brand: 0, product: 0 }
  for (const route of routes) {
    const segment = route.path.replace(/^\//, '')
    const kind = segment.split('/')[0]
    const parts = segment.split('/')
    if (!parts.every((p) => p.length > 0 && !/[/.\\]|^\.+$/.test(p))) {
      console.warn(`prerender-meta: skipped unsafe slug in ${route.path}`)
      continue
    }
    // dist/<route>.html, not dist/<route>/index.html — the directory layout
    // makes Cloudflare 308 the extensionless URL to its trailing-slash form.
    const file = join('dist', `${segment}.html`)
    if (existsSync(file)) {
      // Re-runs overwrite our own output (identified by the canonical link);
      // anything else at that path is a build asset and must not be clobbered.
      const own = !statSync(file).isDirectory() && readFileSync(file, 'utf8').includes('<link rel="canonical"')
      if (!own) {
        console.error(`prerender-meta: refusing to overwrite ${file} — collides with existing build output`)
        process.exit(1)
      }
    }
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, render(route))
    counts[kind] = (counts[kind] ?? 0) + 1
  }

  const written = Object.values(counts).reduce((a, b) => a + b, 0)
  console.log(
    `prerender-meta: wrote ${written} route files ` +
      `(catalog: ${counts.catalog}, categories: ${counts.category}, ` +
      `brands: ${counts.brand}, products: ${counts.product})`,
  )
  console.log(`prerender-meta: og:image default = ${defaultOg}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
