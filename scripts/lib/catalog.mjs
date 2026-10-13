// Shared Supabase helpers for the build scripts (generate-sitemap,
// prerender-meta): .env loading and the "active products + non-empty
// categories/brands" route-set logic, so both scripts stay in lockstep.

import { existsSync, readFileSync } from 'node:fs'

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
export function loadEnv() {
  return { ...loadEnvFile(), ...process.env }
}

/**
 * Fetch the route set both scripts share: active products, plus only the
 * categories and brands that have at least one active product (FK filtering).
 * Query errors are returned rather than thrown so each caller can decide —
 * the sitemap keeps its historical tolerant behaviour, prerender fails loud.
 *
 * Select strings are per-caller because the two scripts need different
 * columns; filtering logic lives here so it cannot drift apart.
 */
export async function fetchActiveCatalog(supabase, selects) {
  const [productsRes, categoriesRes, brandsRes] = await Promise.all([
    supabase.from('products').select(selects.product).eq('is_active', true).order('slug', { ascending: true }),
    supabase.from('categories').select(selects.category).order('slug', { ascending: true }),
    supabase.from('brands').select(selects.brand).order('slug', { ascending: true }),
  ])

  const error = productsRes.error || categoriesRes.error || brandsRes.error
  const products = productsRes.data ?? []

  const categoryIdsWithProducts = new Set(products.map((p) => p.category_id).filter(Boolean))
  const brandIdsWithProducts = new Set(products.map((p) => p.brand_id).filter(Boolean))

  return {
    error,
    products,
    categories: (categoriesRes.data ?? []).filter((c) => categoryIdsWithProducts.has(c.id)),
    brands: (brandsRes.data ?? []).filter((b) => brandIdsWithProducts.has(b.id)),
  }
}
