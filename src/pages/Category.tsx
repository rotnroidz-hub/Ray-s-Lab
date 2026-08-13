import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useBrands, useCategories, useProducts } from '../hooks/useData'
import { useSeo } from '../lib/seo'
import { responsiveImage } from '../lib/image'
import { ProductGrid } from '../components/catalog/ProductGrid'
import { CategoryTile } from '../components/catalog/CategoryTile'
import { FacetChip, FacetRow } from '../components/catalog/Facet'
import { Reveal } from '../components/ui/Reveal'
import { LinkButton } from '../components/ui/Button'

export function Category() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [brand, setBrand] = useState<string | undefined>(undefined)
  const { data: categories } = useCategories()
  const { data: brands } = useBrands()
  const products = useProducts(slug, undefined, 12, brand)

  const category = categories.find((c) => c.slug === slug)

  useSeo({
    title: category?.name ?? 'Category',
    description: category
      ? `Browse ${category.name} — shop the collection and order over WhatsApp.`
      : undefined,
    canonicalPath: category ? `/category/${category.slug}` : undefined,
    ogImage: category?.image_url ?? undefined,
  })

  if (!products.loading && !category && categories.length > 0) {
    // Slug resolved by the API internally; if the fetch returned nothing we
    // show the empty state below rather than a hard error.
    return <CategoryEmpty title="Category not found" />
  }

  const otherCategories = categories.filter((c) => c.slug !== slug)

  return (
    <div className="container-site pb-20">
      <nav aria-label="Breadcrumb" className="pt-6 text-xs text-ink-faint">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link to="/" className="hover:text-ink">Home</Link>
          </li>
          <li aria-hidden>·</li>
          <li>
            <Link to="/catalog" className="hover:text-ink">Catalog</Link>
          </li>
          <li aria-hidden>·</li>
          <li className="text-ink" aria-current="page">{category?.name ?? slug}</li>
        </ol>
      </nav>

      <header className="py-8 sm:py-12">
        {category?.image_url ? (
          <Reveal>
            <div className="media-frame mb-6 h-56 w-full overflow-hidden sm:h-72">
              <img
                src={responsiveImage(category.image_url, 1200)}
                alt={category.name}
                className="h-full w-full object-cover"
              />
            </div>
          </Reveal>
        ) : null}
        <Reveal delay={0.05}>
          <p className="eyebrow">Category</p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            {category?.name ?? 'Category'}
          </h1>
        </Reveal>

        {brands.length > 0 && (
          <div className="mt-6">
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
        <CategoryEmpty title={`No products in ${category?.name ?? 'this category'} yet`} />
      )}

      {otherCategories.length > 0 && (
        <section className="section-band -mx-4 mt-16 rounded-2xl px-4 py-10 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 sm:py-14">
          <Reveal>
            <div className="flex items-end justify-between">
              <div>
                <p className="eyebrow">Keep exploring</p>
                <h2 className="mt-1 font-display text-2xl sm:text-3xl">Explore more categories</h2>
              </div>
              <LinkButton to="/catalog" variant="ghost" className="hidden text-sm sm:inline-flex">
                All products
              </LinkButton>
            </div>
          </Reveal>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {otherCategories.map((c, i) => (
              <CategoryTile key={c.id} category={c} index={i} />
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <LinkButton to="/catalog" variant="outline" className="text-sm">
              All products
            </LinkButton>
          </div>
        </section>
      )}
    </div>
  )
}

function CategoryEmpty({ title }: { title: string }) {
  return (
    <div className="py-24 text-center">
      <p className="font-display text-xl text-ink">{title}</p>
      <Link
        to="/catalog"
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition-all hover:border-ink hover:bg-ink hover:text-paper"
      >
        Browse all products
      </Link>
    </div>
  )
}
