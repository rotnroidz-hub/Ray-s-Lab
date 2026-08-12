import { useEffect } from 'react'
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from './constants'
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

/** Branded default description — what the shop actually sells. */
const DEFAULT_DESCRIPTION =
  'Ray BodyLab curates premium audio, wearables and everyday accessories. ' +
  'Browse the catalog, build your order and check out directly over WhatsApp.'

/** Applies SEO side-effects immediately (used on non-React entry too if needed). */
export function applySeo({ title, description, canonicalPath, robots, ogImage, jsonLd }: SeoOptions) {
  // Home gets "Ray BodyLab | [tagline]", subpages get "[Page] | Ray BodyLab".
  const documentTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | ${SITE_TAGLINE}`
  document.title = documentTitle

  const desc = description || DEFAULT_DESCRIPTION
  const url = canonicalPath && SITE_URL ? `${SITE_URL}${canonicalPath === '/' ? '/' : `/${canonicalPath.replace(/^\//, '')}`}` : null

  // Standard SEO
  upsertMeta('name', 'description', desc)
  if (robots) upsertMeta('name', 'robots', robots)
  if (url) upsertCanonical(url)

  // Open Graph — social sharing previews
  upsertMeta('property', 'og:site_name', SITE_NAME)
  upsertMeta('property', 'og:title', documentTitle)
  upsertMeta('property', 'og:description', desc)
  upsertMeta('property', 'og:type', 'website')
  upsertMeta('property', 'og:locale', 'en_US')
  if (url) upsertMeta('property', 'og:url', url)
  if (ogImage) {
    upsertMeta('property', 'og:image', ogImage)
    upsertMeta('name', 'twitter:image', ogImage)
  }
  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', documentTitle)
  upsertMeta('name', 'twitter:description', desc)

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