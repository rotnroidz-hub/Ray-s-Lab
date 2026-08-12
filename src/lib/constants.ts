export const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'Catalog Site'
export const SITE_URL = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '')
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || ''
export const WHATSAPP_INTRO =
  import.meta.env.VITE_WHATSAPP_INTRO || 'Hello! I would like to place an order:'

export const PRODUCTS_PER_PAGE = 12

export const ADMIN_PATHS = ['/admin', '/admin/products', '/admin/categories', '/admin/banners']