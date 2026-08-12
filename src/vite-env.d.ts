/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_NAME?: string
  readonly VITE_SITE_TAGLINE?: string
  readonly VITE_SITE_URL?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_WHATSAPP_NUMBER?: string
  readonly VITE_WHATSAPP_INTRO?: string
  readonly VITE_CURRENCY?: string
  readonly VITE_CURRENCY_LABEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}