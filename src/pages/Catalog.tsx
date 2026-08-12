import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProducts, useCategories } from '../hooks/useData'
import { useSeo } from '../lib/seo'
import { cn } from '../lib/utils'
import { ProductGrid } from '../components/catalog/ProductGrid'
import { LinkButton } from '../components/ui/Button'
import { IconSearch } from '../components/ui/Icons'

export function Catalog() {
  const [params] = useSearchParams()
  const activeCategory = params.get('category') ?? undefined
  const [category, setCategory] = useState(activeCategory)
  const { data: categories } = useCategories()
  const products = useProducts(category, undefined, 12)

  useSeo({
    title: 'All Products',
    description: 'Browse the full catalog — every product, filterable by category.',
    canonicalPath: '/catalog',
  })

  return (
    <div className="container-site pb-20">
      <header className="py-10 sm:py-14">
        <p className="eyebrow">The catalog</p>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">All products</h1>
        <p className="mt-3 max-w-xl text-sm text-ink-muted">
          Every item we currently carry. Filter by category, or search for something specific.
        </p>
      </header>

      <div className="sticky top-16 z-30 -mx-4 mb-8 border-b border-ink/8 bg-canvas/90 px-4 py-3 backdrop-blur sm:top-20">
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Categories">
          <button
            type="button"
            onClick={() => setCategory(undefined)}
            className={chip(!category)}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.slug === category ? undefined : c.slug)}
              className={chip(c.slug === category)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <ProductGrid
        products={products.data}
        loading={products.loading}
        hasMore={products.hasMore}
        onLoadMore={products.loadMore}
      />

      {!products.loading && products.data.length === 0 && (
        <div className="py-24 text-center">
          <IconSearch className="mx-auto h-10 w-10 text-ink/25" />
          <p className="mt-4 font-display text-xl text-ink">Nothing here yet</p>
          <p className="mt-2 text-sm text-ink-muted">
            Products in this category haven't been added yet.
          </p>
          <div className="mt-6">
            <LinkButton to="/" variant="outline">Back to home</LinkButton>
          </div>
        </div>
      )}
    </div>
  )
}

function chip(active: boolean) {
  return cn(
    'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all',
    active
      ? 'bg-pine text-canvas shadow-[0_6px_16px_-8px_rgba(47,74,60,0.8)]'
      : 'border border-ink/15 text-ink-soft hover:border-ink/40 hover:text-ink',
  )
}