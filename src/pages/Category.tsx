import { Link, useParams } from 'react-router-dom'
import { useCategories, useProducts } from '../hooks/useData'
import { useSeo } from '../lib/seo'
import { responsiveImage } from '../lib/image'
import { ProductGrid } from '../components/catalog/ProductGrid'
import { IconChevronLeft, IconChevronRight } from '../components/ui/Icons'

export function Category() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { data: categories } = useCategories()
  const products = useProducts(slug, undefined, 12)

  const category = categories.find((c) => c.slug === slug)
  const index = categories.findIndex((c) => c.slug === slug)
  const prev = index > 0 ? categories[index - 1] : null
  const next = index >= 0 && index < categories.length - 1 ? categories[index + 1] : null

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
          <li className="text-ink" aria-current="page">{category?.name ?? slug}</li>
        </ol>
      </nav>

      <header className="py-8 sm:py-12">
        {category?.image_url ? (
          <div className="media-frame mb-6 h-56 w-full overflow-hidden sm:h-72">
            <img
              src={responsiveImage(category.image_url, 1200)}
              alt={category.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
        <p className="eyebrow">Category</p>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
          {category?.name ?? 'Category'}
        </h1>
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

      {(prev || next) && (
        <nav className="mt-16 flex items-center justify-between border-t border-ink/8 pt-6" aria-label="Categories">
          {prev ? (
            <Link
              to={`/category/${prev.slug}`}
              className="group inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink"
            >
              <IconChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              {prev.name}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to={`/category/${next.slug}`}
              className="group inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink"
            >
              {next.name}
              <IconChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
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
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition-all hover:border-ink hover:bg-ink hover:text-canvas"
      >
        Browse all products
      </Link>
    </div>
  )
}