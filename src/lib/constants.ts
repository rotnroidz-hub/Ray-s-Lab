export const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'Ray BodyLab'
export const SITE_TAGLINE =
  import.meta.env.VITE_SITE_TAGLINE || 'Whey Protein, Creatine & Supplements'
export const SITE_URL = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '')
// Digits only: wa.me rejects anything else (a stray "=" in the build env
// produced / =601…?text=… → api.whatsapp.com/resolve/?…&not_found=1).
export const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '')
export const WHATSAPP_INTRO =
  import.meta.env.VITE_WHATSAPP_INTRO || 'Hello! I would like to place an order:'

export const PRODUCTS_PER_PAGE = 12

export const ADMIN_PATHS = ['/admin', '/admin/products', '/admin/categories', '/admin/brands', '/admin/banners']