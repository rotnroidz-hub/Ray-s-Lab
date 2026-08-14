import { supabase } from './supabase'
import type { Banner, Brand, Category, Product, StockStatus } from './types'

export interface ProductQuery {
  categorySlug?: string
  brandSlug?: string
  search?: string
  page?: number
  pageSize?: number
  featured?: boolean
}

export interface ProductPage {
  products: Product[]
  count: number
}

interface ProductRow extends Omit<Product, 'price' | 'stock_status'> {
  price: string
  stock_status: StockStatus
}

function hydrateProduct(row: ProductRow): Product {
  return { ...row, price: Number(row.price) }
}

// --- Brand capability ------------------------------------------------------
// The `brands` table is an additive migration. Until it has been applied to
// the live Supabase project the storefront must keep working without brand
// joins/filters; once present, they turn on automatically. The check is done
// once per session and cached.
let brandsChecked = false
let brandsCapable = false

async function ensureBrandsCapability() {
  if (brandsChecked) return
  brandsChecked = true
  const { error } = await supabase.from('brands').select('id').limit(1)
  brandsCapable = !error
}

const productSelect = (): string =>
  brandsCapable
    ? '*, categories(id, name, slug), brands(id, name, slug)'
    : '*, categories(id, name, slug)'

export async function fetchBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as Banner[]) ?? []
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as Category[]) ?? []
}

export async function fetchBrands(): Promise<Brand[]> {
  await ensureBrandsCapability()
  if (!brandsCapable) return []
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as Brand[]) ?? []
}

/** Products joined with their category & brand for breadcrumbs / filtering. */
export async function fetchProducts(query: ProductQuery = {}): Promise<ProductPage> {
  const { categorySlug, brandSlug, search, page = 1, pageSize = 12, featured } = query
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  await ensureBrandsCapability()

  let q = supabase
    .from('products')
    .select(productSelect(), { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (categorySlug) {
    // Resolve category id first so we can filter on the FK in one query shape.
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .maybeSingle()
    if (!cat) return { products: [], count: 0 }
    q = q.eq('category_id', cat.id)
  }

  if (brandSlug && brandsCapable) {
    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('slug', brandSlug)
      .maybeSingle()
    if (!brand) return { products: [], count: 0 }
    q = q.eq('brand_id', brand.id)
  }

  if (search && search.trim()) {
    // Strip characters that would break PostgREST's `or()` filter or the array
    // literal for tags (braces, commas, parens, ampersand, wildcards…).
    const term = search
      .trim()
      .replace(/[%_{}()&,.!]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (term) {
      // Include brand name in matching: a query like "jbl" surfaces the brand
      // even when the product title doesn't mention it.
      const brandClause = brandsCapable ? `,brands.name.ilike.%${term}%` : ''
      q = q.or(
        `name.ilike.%${term}%,description.ilike.%${term}%,tags.cs.{${term}}${brandClause}`,
      )
    }
  }

  if (featured) q = q.limit(8)

  q = q.range(from, to)

  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  const rows = (data as unknown as ProductRow[]) ?? []
  return { products: rows.map(hydrateProduct), count: count ?? 0 }
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  await ensureBrandsCapability()
  const { data, error } = await supabase
    .from('products')
    .select(productSelect())
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return hydrateProduct(data as unknown as ProductRow)
}

export async function fetchRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  if (!product.category_id) return []
  await ensureBrandsCapability()
  const { data, error } = await supabase
    .from('products')
    .select(productSelect())
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .eq('is_active', true)
    .limit(limit)
  if (error) throw new Error(error.message)
  return ((data as unknown as ProductRow[]) ?? []).map(hydrateProduct)
}

export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return []
  await ensureBrandsCapability()
  const { data, error } = await supabase
    .from('products')
    .select(productSelect())
    .in('id', ids)
    .eq('is_active', true)
  if (error) throw new Error(error.message)
  return ((data as unknown as ProductRow[]) ?? []).map(hydrateProduct)
}

// --- Brand → category map for the mega menu ---------------------------------
export type BrandMenuEntry = {
  brand: { id: string; name: string; slug: string }
  total: number
  categories: { name: string; slug: string; count: number }[]
}

interface BrandMenuRow {
  brand_id: string | null
  category_id: string | null
  brands: { id: string; name: string; slug: string } | null
  categories: { id: string; name: string; slug: string } | null
}

// The promise is cached at module level so repeated calls do not refetch.
let brandMenuPromise: Promise<BrandMenuEntry[]> | null = null

export function fetchBrandCategoryMap(): Promise<BrandMenuEntry[]> {
  if (!brandMenuPromise) brandMenuPromise = loadBrandCategoryMap()
  return brandMenuPromise
}

async function loadBrandCategoryMap(): Promise<BrandMenuEntry[]> {
  await ensureBrandsCapability()
  if (!brandsCapable) return []

  const { data, error } = await supabase
    .from('products')
    .select('brand_id, category_id, brands(id,name,slug), categories(id,name,slug)')
    .eq('is_active', true)
  if (error) throw new Error(error.message)

  const rows = (data as unknown as BrandMenuRow[]) ?? []
  const byBrand = new Map<string, BrandMenuEntry>()
  for (const row of rows) {
    if (!row.brand_id || !row.brands) continue
    let entry = byBrand.get(row.brand_id)
    if (!entry) {
      entry = {
        brand: { id: row.brands.id, name: row.brands.name, slug: row.brands.slug },
        total: 0,
        categories: [],
      }
      byBrand.set(row.brand_id, entry)
    }
    entry.total += 1
    if (row.category_id && row.categories) {
      const cat = entry.categories.find((c) => c.slug === row.categories!.slug)
      if (cat) cat.count += 1
      else entry.categories.push({ name: row.categories.name, slug: row.categories.slug, count: 1 })
    }
  }

  const list = Array.from(byBrand.values())
  list.sort((a, b) => b.total - a.total || a.brand.name.localeCompare(b.brand.name))
  for (const entry of list) entry.categories.sort((a, b) => b.count - a.count)
  return list
}
