import { useEffect } from 'react'
import { SITE_NAME, SITE_URL } from './constants'
import type { Product } from './types'

function upsertMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function upsertJsonLd(json: unknown) {
  document.getElementById('route-jsonld')?.remove()
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.id = 'route-jsonld'
  script.textContent = JSON.stringify(json)
  document.head.appendChild(script)
}

export interface SeoOptions {
  title?: string
  description?: string
  canonicalPath?: string
  robots?: string
  ogImage?: string | null
  jsonLd?: unknown
}

/** Applies SEO side-effects immediately (used on non-React entry too if needed). */
export function applySeo({ title, description, canonicalPath, robots, ogImage, jsonLd }: SeoOptions) {
  document.title = title ? `${title} — ${SITE_NAME}` : SITE_NAME

  const defaultDescription =
    'Browse the catalog, build your order, and check out directly over WhatsApp.'
  const desc = description || defaultDescription
  upsertMeta('name', 'description', desc)
  upsertMeta('property', 'og:description', desc)
  upsertMeta('property', 'og:title', document.title)
  upsertMeta('property', 'og:type', 'website')

  if (robots) {
    upsertMeta('name', 'robots', robots)
  }
  if (ogImage) {
    upsertMeta('property', 'og:image', ogImage)
  }
  if (canonicalPath && SITE_URL) {
    upsertCanonical(`${SITE_URL}${canonicalPath === '/' ? '/' : `/${canonicalPath.replace(/^\//, '')}`}`)
  }
  if (jsonLd) upsertJsonLd(jsonLd)
}

/**
 * Hook for one-page SEO. Keep `jsonLd` memoized at the call site (useMemo) — it
 * is read from the render-time closure so changing it without changing a
 * primitive dep still lands on the next commit.
 */
export function useSeo(options: SeoOptions) {
  useEffect(() => {
    applySeo(options)
    // options.jsonLd is intentionally excluded: see doc comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.title, options.description, options.canonicalPath, options.robots, options.ogImage])
}

export function productJsonLd(product: Product, canonicalPath: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images[0] ?? null,
    sku: product.slug,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}${canonicalPath}`,
      priceCurrency: import.meta.env.VITE_CURRENCY || 'USD',
      price: product.price,
      availability:
        product.stock_status === 'available'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  }
}