import { supabase } from './supabase'
import type { Banner, Brand, Category, Product } from './types'

// ---------------------------------------------------------------------------
// Admin-only data access. These still go through RLS: every write below
// requires an authenticated admin session server-side, so a forged client
// request is rejected by Postgres regardless of what this code does.
// ---------------------------------------------------------------------------

// --- Brand capability (see api.ts): brands are an additive migration. ------
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

export interface AdminProductInput {
  name: string
  slug: string
  description: string
  price: number
  category_id: string | null
  brand_id: string | null
  stock_status: 'available' | 'no_stock'
  is_active: boolean
  images: string[]
  tags: string[]
  benefits: string | null
  dosage_cycle: string | null
  product_note: string | null
  is_featured: boolean
  featured_order: number
}

export async function listProductsAdmin(): Promise<Product[]> {
  await ensureBrandsCapability()
  const { data, error } = await supabase
    .from('products')
    .select(productSelect())
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return ((data as unknown as Product[]) ?? []).map((r) => ({ ...r, price: Number(r.price) }))
}

export async function getProductAdmin(id: string): Promise<Product | null> {
  await ensureBrandsCapability()
  const { data, error } = await supabase
    .from('products')
    .select(productSelect())
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? { ...(data as unknown as Product), price: Number((data as unknown as Product).price) } : null
}

export async function createProductAdmin(input: AdminProductInput): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({ ...input, price: input.price })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return { ...data, price: Number(data.price) }
}

export async function updateProductAdmin(id: string, input: AdminProductInput): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({ ...input, price: input.price })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return { ...data, price: Number(data.price) }
}

export async function deleteProductAdmin(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// --- Categories -------------------------------------------------------------

export async function listCategoriesAdmin(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createCategoryAdmin(input: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
  const { data, error } = await supabase.from('categories').insert(input).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateCategoryAdmin(id: string, input: Partial<Category>): Promise<void> {
  const { error } = await supabase.from('categories').update(input).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteCategoryAdmin(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function reorderCategoriesAdmin(orderedIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, sort_order) =>
      supabase.from('categories').update({ sort_order }).eq('id', id),
    ),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw new Error(failed.error.message)
}

// --- Brands -----------------------------------------------------------------

export async function listBrandsAdmin(): Promise<Brand[]> {
  await ensureBrandsCapability()
  if (!brandsCapable) return []
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createBrandAdmin(input: Omit<Brand, 'id' | 'created_at' | 'updated_at'>): Promise<Brand> {
  const { data, error } = await supabase.from('brands').insert(input).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateBrandAdmin(id: string, input: Partial<Brand>): Promise<void> {
  const { error } = await supabase.from('brands').update(input).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteBrandAdmin(id: string): Promise<void> {
  const { error } = await supabase.from('brands').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function reorderBrandsAdmin(orderedIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, sort_order) =>
      supabase.from('brands').update({ sort_order }).eq('id', id),
    ),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw new Error(failed.error.message)
}

// --- Banners ----------------------------------------------------------------

export interface AdminBannerInput {
  image_url: string
  title: string
  subtitle: string
  link_url: string
  sort_order: number
  is_active: boolean
  eyebrow: string | null
  cta_label: string | null
  cta2_label: string | null
  cta2_url: string | null
}

export async function listBannersAdmin(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function upsertBannerAdmin(input: Partial<AdminBannerInput> & { id?: string }): Promise<Banner> {
  const payload: {
    id?: string
    image_url?: string
    title?: string
    subtitle?: string
    link_url?: string
    sort_order?: number
    is_active?: boolean
    eyebrow?: string | null
    cta_label?: string | null
    cta2_label?: string | null
    cta2_url?: string | null
  } = { ...input }
  const { data, error } = await supabase.from('banners').upsert(payload).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteBannerAdmin(id: string): Promise<void> {
  const { error } = await supabase.from('banners').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// --- Featured (Handpicked) ---------------------------------------------------

export async function listFeaturedProductsAdmin(): Promise<Product[]> {
  await ensureBrandsCapability()
  const { data, error } = await supabase
    .from('products')
    .select(productSelect())
    .eq('is_featured', true)
    .order('featured_order', { ascending: true })
  if (error) throw new Error(error.message)
  return ((data as unknown as Product[]) ?? []).map((r) => ({ ...r, price: Number(r.price) }))
}

export async function listNonFeaturedProductsAdmin(): Promise<Product[]> {
  await ensureBrandsCapability()
  const { data, error } = await supabase
    .from('products')
    .select(productSelect())
    .eq('is_featured', false)
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return ((data as unknown as Product[]) ?? []).map((r) => ({ ...r, price: Number(r.price) }))
}

export async function setProductFeatured(id: string, is_featured: boolean, featured_order = 0): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ is_featured, featured_order })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function reorderFeatured(rows: { id: string; featured_order: number }[]): Promise<void> {
  const results = await Promise.all(
    rows.map((r) =>
      supabase.from('products').update({ featured_order: r.featured_order }).eq('id', r.id),
    ),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw new Error(failed.error.message)
}

// --- Dashboard ---------------------------------------------------------------

export async function countCheckoutsThisWeek(): Promise<number> {
  const { count, error } = await supabase
    .from('checkout_events')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  if (error) throw new Error(error.message)
  return count ?? 0
}

// --- Storage ----------------------------------------------------------------

const BUCKET = 'product-images'

export async function uploadProductImage(file: File): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path }
}

export async function deleteProductImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw new Error(error.message)
}

/** Extracts the storage path from a public URL so images can be cleaned up. */
export function storagePathFromUrl(url: string): string | null {
  const marker = '/storage/v1/object/public/product-images/'
  const i = url.indexOf(marker)
  if (i === -1) return null
  return url.slice(i + marker.length).split('?')[0]
}