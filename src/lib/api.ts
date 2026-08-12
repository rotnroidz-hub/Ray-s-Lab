import { supabase } from './supabase'
import type { Banner, Category, Product, StockStatus } from './types'

export interface ProductQuery {
  categorySlug?: string
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

/** Products joined with their category for breadcrumbs / filtering. */
export async function fetchProducts(query: ProductQuery = {}): Promise<ProductPage> {
  const { categorySlug, search, page = 1, pageSize = 12, featured } = query
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let q = supabase
    .from('products')
    .select('*, categories(id, name, slug)', { count: 'exact' })
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

  if (search && search.trim()) {
    // Strip characters that would break PostgREST's `or()` filter or the array
    // literal for tags (braces, commas, parens, ampersand, wildcards…).
    const term = search
      .trim()
      .replace(/[%_{}()&,.!]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (term) {
      q = q.or(`name.ilike.%${term}%,description.ilike.%${term}%,tags.cs.{${term}}`)
    }
  }

  if (featured) q = q.limit(8)

  q = q.range(from, to)

  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { products: (data as ProductRow[] ?? []).map(hydrateProduct), count: count ?? 0 }
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(id, name, slug)')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return hydrateProduct(data as ProductRow)
}

export async function fetchRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  if (!product.category_id) return []
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(id, name, slug)')
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .eq('is_active', true)
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data as ProductRow[] ?? []).map(hydrateProduct)
}

export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(id, name, slug)')
    .in('id', ids)
    .eq('is_active', true)
  if (error) throw new Error(error.message)
  return (data as ProductRow[] ?? []).map(hydrateProduct)
}