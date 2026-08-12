import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useBrands, useCategories, useProducts } from '../hooks/useData'
import { useSeo } from '../lib/seo'
import { ProductGrid } from '../components/catalog/ProductGrid'
import { FacetChip, FacetRow } from '../components/catalog/Facet'
import { LinkButton } from '../components/ui/Button'
import { IconSearch } from '../components/ui/Icons'

export function Catalog() {
  const [params] = useSearchParams()
  const activeCategory = params.get('category') ?? undefined
  const activeBrand = params.get('brand') ?? undefined
  const [category, setCategory] = useState(activeCategory)
  const [brand, setBrand] = useState(activeBrand)
  const { data: categories } = useCategories()
  const { data: brands } = useBrands()
  const products = useProducts(category, undefined, 12, brand)

  useSeo({
    title: 'All Products',
    description: 'Browse the full catalog — every product, filterable by category and brand.',
    canonicalPath: '/catalog',
  })

  return (
    <div className="container-site pb-20">
      <header className="py-10 sm:py-14">
        <p className="eyebrow">The catalog</p>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">All products</h1>
        <p className="mt-3 max-w-xl text-sm text-ink-muted">
          Every item we currently carry. Filter by category or brand, or search for something specific.
        </p>
      </header>

      <div className="sticky top-16 z-30 -mx-4 mb-8 space-y-2.5 border-b border-ink/8 bg-canvas/90 px-4 py-3 backdrop-blur sm:top-20">
        <FacetRow label="Category">
          <FacetChip label="All" active={!category} onClick={() => setCategory(undefined)} />
          {categories.map((c) => (
            <FacetChip
              key={c.id}
              label={c.name}
              active={c.slug === category}
              onClick={() => setCategory(c.slug === category ? undefined : c.slug)}
            />
          ))}
        </FacetRow>
        <FacetRow label="Brand">
          <FacetChip label="All" active={!brand} onClick={() => setBrand(undefined)} />
          {brands.map((b) => (
            <FacetChip
              key={b.id}
              label={b.name}
              active={b.slug === brand}
              onClick={() => setBrand(b.slug === brand ? undefined : b.slug)}
            />
          ))}
        </FacetRow>
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
            Products matching this combination haven't been added yet.
          </p>
          <div className="mt-6">
            <LinkButton to="/" variant="outline">Back to home</LinkButton>
          </div>
        </div>
      )}
    </div>
  )
}
