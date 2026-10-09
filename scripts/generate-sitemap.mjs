// Generates a fresh sitemap.xml from the Supabase catalog.
// Usage:  npm run generate:sitemap
// Reads VITE_SITE_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY from the
// environment, falling back to .env when that file exists.
// Run it (and commit public/sitemap.xml) whenever products change, or wire it
// into your CI/Vercel build.

import { writeFileSync } from 'node:fs'
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

const supabase = createClient(supabaseUrl, anonKey)

function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function main() {
  // Route set + is_active/FK filtering shared with scripts/prerender-meta.mjs.
  const { products, categories, brands } = await fetchActiveCatalog(supabase, {
    product: 'slug, updated_at, brand_id, category_id',
    category: 'id, slug, updated_at',
    brand: 'id, slug, updated_at',
  })

  const urls = [
    { loc: siteUrl + '/' },
    { loc: siteUrl + '/catalog' },
  ]

  for (const c of categories) {
    urls.push({
      loc: `${siteUrl}/category/${esc(c.slug)}`,
      lastmod: c.updated_at ? new Date(c.updated_at).toISOString().slice(0, 10) : undefined,
    })
  }
  for (const b of brands) {
    urls.push({
      loc: `${siteUrl}/brand/${esc(b.slug)}`,
      lastmod: b.updated_at ? new Date(b.updated_at).toISOString().slice(0, 10) : undefined,
    })
  }
  for (const p of products) {
    urls.push({
      loc: `${siteUrl}/product/${esc(p.slug)}`,
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : undefined,
    })
  }

  const body = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`,
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  writeFileSync('public/sitemap.xml', xml)
  console.log(`sitemap.xml written with ${urls.length} URLs`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})