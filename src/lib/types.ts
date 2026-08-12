export type StockStatus = 'available' | 'no_stock'

export interface Category {
  id: string
  name: string
  slug: string
  image_url: string | null
  sort_order: number
  created_at?: string
  updated_at?: string
}

export interface Brand {
  id: string
  name: string
  slug: string
  image_url: string | null
  sort_order: number
  created_at?: string
  updated_at?: string
}

export interface Product {
  id: string
  category_id: string | null
  brand_id: string | null
  name: string
  slug: string
  description: string
  price: number
  stock_status: StockStatus
  is_active: boolean
  images: string[]
  tags: string[]
  created_at?: string
  updated_at?: string
  categories?: Pick<Category, 'id' | 'name' | 'slug'> | null
  brands?: Pick<Brand, 'id' | 'name' | 'slug'> | null
}

export interface Banner {
  id: string
  image_url: string
  title: string
  subtitle: string
  link_url: string
  sort_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

/** A line item in the cart. Stored in localStorage. */
export interface CartItem {
  product_id: string
  name: string
  slug: string
  price: number
  image: string | null
  stock_status: StockStatus
  qty: number
}