// Generates a fresh sitemap.xml from the Supabase catalog.
// Usage:  npm run generate:sitemap
// Reads VITE_SITE_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY from the
// environment, falling back to .env when that file exists.
// Run it (and commit public/sitemap.xml) whenever products change, or wire it
// into your CI/Vercel build.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

/** Parse .env into a plain object (comments skipped, `=` in values kept). */
function loadEnvFile() {
  if (!existsSync('.env')) return {}
  const raw = readFileSync('.env', 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2]
  }
  return env
}

/**
 * `.env` is gitignored, so it does not exist on the CI build machine. Read it
 * only when present, and let real environment variables win over file values.
 */
function loadEnv() {
  return { ...loadEnvFile(), ...process.env }
}

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
  const [{ data: products }, { data: categories }, { data: brands }] = await Promise.all([
    supabase.from('products').select('slug, updated_at, brand_id, category_id').eq('is_active', true),
    supabase.from('categories').select('id, slug, updated_at'),
    supabase.from('brands').select('id, slug, updated_at'),
  ])

  // Only emit brands/categories that actually have at least one active product.
  const categoryIdsWithProducts = new Set(
    (products ?? []).map((p) => p.category_id).filter(Boolean),
  )
  const brandIdsWithProducts = new Set((products ?? []).map((p) => p.brand_id).filter(Boolean))

  const urls = [
    { loc: siteUrl + '/' },
    { loc: siteUrl + '/catalog' },
  ]

  for (const c of categories ?? []) {
    if (!categoryIdsWithProducts.has(c.id)) continue
    urls.push({
      loc: `${siteUrl}/category/${esc(c.slug)}`,
      lastmod: c.updated_at ? new Date(c.updated_at).toISOString().slice(0, 10) : undefined,
    })
  }
  for (const b of brands ?? []) {
    if (!brandIdsWithProducts.has(b.id)) continue
    urls.push({
      loc: `${siteUrl}/brand/${esc(b.slug)}`,
      lastmod: b.updated_at ? new Date(b.updated_at).toISOString().slice(0, 10) : undefined,
    })
  }
  for (const p of products ?? []) {
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