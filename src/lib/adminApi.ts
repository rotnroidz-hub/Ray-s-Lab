import { supabase } from './supabase'
import type { Banner, Category, Product } from './types'

// ---------------------------------------------------------------------------
// Admin-only data access. These still go through RLS: every write below
// requires an authenticated admin session server-side, so a forged client
// request is rejected by Postgres regardless of what this code does.
// ---------------------------------------------------------------------------

export interface AdminProductInput {
  name: string
  slug: string
  description: string
  price: number
  category_id: string | null
  stock_status: 'available' | 'no_stock'
  is_active: boolean
  images: string[]
  tags: string[]
}

export async function listProductsAdmin(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(id, name, slug)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({ ...r, price: Number(r.price) }))
}

export async function getProductAdmin(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(id, name, slug)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? { ...data, price: Number(data.price) } : null
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
  const updates = orderedIds.map((id, sort_order) => ({ id, sort_order }))
  const { error } = await supabase.from('categories').upsert(updates)
  if (error) throw new Error(error.message)
}

// --- Banners ----------------------------------------------------------------

export interface AdminBannerInput {
  image_url: string
  title: string
  subtitle: string
  link_url: string
  sort_order: number
  is_active: boolean
}

export async function listBannersAdmin(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function upsertBannerAdmin(input: Partial<Banner> & { id?: string }): Promise<Banner> {
  const payload: {
    id?: string
    image_url?: string
    title?: string
    subtitle?: string
    link_url?: string
    sort_order?: number
    is_active?: boolean
  } = { ...input }
  const { data, error } = await supabase.from('banners').upsert(payload).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteBannerAdmin(id: string): Promise<void> {
  const { error } = await supabase.from('banners').delete().eq('id', id)
  if (error) throw new Error(error.message)
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