// Generates a fresh sitemap.xml from the Supabase catalog.
// Usage:  npm run generate:sitemap
// Reads VITE_SITE_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY from .env.
// Run it (and commit public/sitemap.xml) whenever products change, or wire it
// into your CI/Vercel build.

import { readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  const raw = readFileSync('.env', 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2]
  }
  return env
}

const env = loadEnv()
const siteUrl = (env.VITE_SITE_URL || '').replace(/\/$/, '')
const supabaseUrl = env.VITE_SUPABASE_URL
const anonKey = env.VITE_SUPABASE_ANON_KEY

if (!siteUrl || !supabaseUrl || !anonKey) {
  console.error('Missing VITE_SITE_URL / VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env')
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
    supabase.from('products').select('slug, updated_at').eq('is_active', true),
    supabase.from('categories').select('slug'),
    supabase.from('brands').select('slug'),
  ])

  const urls = [
    { loc: siteUrl + '/', priority: '1.0' },
    { loc: siteUrl + '/catalog', priority: '0.9' },
  ]

  for (const c of categories ?? []) {
    urls.push({ loc: `${siteUrl}/category/${esc(c.slug)}`, priority: '0.8' })
  }
  for (const b of brands ?? []) {
    urls.push({ loc: `${siteUrl}/brand/${esc(b.slug)}`, priority: '0.7' })
  }
  for (const p of products ?? []) {
    urls.push({
      loc: `${siteUrl}/product/${esc(p.slug)}`,
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : undefined,
      priority: '0.8',
    })
  }

  const body = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>daily</changefreq>
    <priority>${u.priority}</priority>
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