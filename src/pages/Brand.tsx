import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useBrands, useCategories, useProducts } from '../hooks/useData'
import { useSeo } from '../lib/seo'
import { SITE_NAME } from '../lib/constants'
import { responsiveImage } from '../lib/image'
import { ProductGrid } from '../components/catalog/ProductGrid'
import { FacetChip, FacetRow } from '../components/catalog/Facet'
import { Reveal } from '../components/ui/Reveal'
import { LinkButton } from '../components/ui/Button'

export function Brand() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [category, setCategory] = useState<string | undefined>(undefined)
  const { data: brands } = useBrands()
  const { data: categories } = useCategories()
  const products = useProducts(category, undefined, 12, slug)

  const brand = brands.find((b) => b.slug === slug)

  useSeo({
    title: brand ? `${brand.name} products` : 'Brand',
    description: brand
      ? `Shop ${brand.name} at ${SITE_NAME} — browse the range and order over WhatsApp.`
      : undefined,
    canonicalPath: brand ? `/brand/${brand.slug}` : undefined,
    ogImage: brand?.image_url ?? undefined,
  })

  if (!products.loading && !brand && brands.length > 0) {
    return <BrandEmpty title="Brand not found" />
  }

  return (
    <div className="container-site pb-20">
      <nav aria-label="Breadcrumb" className="pt-6 text-xs text-ink-muted">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link to="/" className="hover:text-ink">Home</Link>
          </li>
          <li aria-hidden>·</li>
          <li>
            <Link to="/catalog" className="hover:text-ink">Catalog</Link>
          </li>
          <li aria-hidden>·</li>
          <li className="text-ink" aria-current="page">{brand?.name ?? slug}</li>
        </ol>
      </nav>

      <header className="py-8 sm:py-12">
        {brand?.image_url ? (
          <Reveal>
            <div className="media-frame mb-6 h-56 w-full overflow-hidden sm:h-72">
              <img
                src={responsiveImage(brand.image_url, 1200)}
                alt={brand.name}
                className="h-full w-full object-cover"
              />
            </div>
          </Reveal>
        ) : null}
        <Reveal delay={0.05}>
          <p className="eyebrow">Brand</p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            {brand?.name ?? 'Brand'}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ink-muted">
            Every {brand?.name ?? 'this brand'} product we currently carry.
          </p>
        </Reveal>

        {categories.length > 0 && (
          <div className="mt-6">
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
          </div>
        )}
      </header>

      <ProductGrid
        products={products.data}
        loading={products.loading}
        skeletonCount={8}
        hasMore={products.hasMore}
        onLoadMore={products.loadMore}
      />

      {!products.loading && products.data.length === 0 && (
        <BrandEmpty title={`No ${brand?.name ?? 'brand'} products yet`} />
      )}
    </div>
  )
}

function BrandEmpty({ title }: { title: string }) {
  return (
    <div className="py-24 text-center">
      <p className="font-display text-xl text-ink">{title}</p>
      <LinkButton to="/catalog" variant="outline" className="mt-6">
        Browse all products
      </LinkButton>
    </div>
  )
}
