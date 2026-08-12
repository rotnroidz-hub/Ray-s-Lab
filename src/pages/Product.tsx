import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useProduct, useRelatedProducts } from '../hooks/useData'
import { useCart } from '../hooks/useCart'
import { useFlyToCart } from '../components/cart/FlyToCart'
import { productJsonLd, useSeo } from '../lib/seo'
import { formatPrice } from '../lib/utils'
import { responsiveImage } from '../lib/image'
import { StockBadge } from '../components/ui/StockBadge'
import { QuantityStepper } from '../components/ui/QuantityStepper'
import { Button } from '../components/ui/Button'
import { ProductCard } from '../components/catalog/ProductCard'
import { Skeleton } from '../components/ui/Skeleton'
import { IconChevronLeft, IconImage, IconWhatsApp } from '../components/ui/Icons'

export function Product() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { data: product, loading, error } = useProduct(slug)
  const related = useRelatedProducts(product)
  const { addItem, openCart } = useCart()
  const fly = useFlyToCart()
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)

  useSeo({
    title: product?.name,
    description: product?.description.slice(0, 160),
    canonicalPath: product ? `/product/${product.slug}` : undefined,
    ogImage: product?.images[0] ?? undefined,
    jsonLd: product ? productJsonLd(product, `/product/${product.slug}`) : undefined,
  })

  if (loading) {
    return (
      <div className="container-site grid gap-10 py-10 lg:grid-cols-2">
        <Skeleton className="aspect-[4/5] w-full rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container-site py-28 text-center">
        <h1 className="font-display text-2xl text-ink">Product not found</h1>
        <p className="mt-2 text-sm text-ink-muted">It may have been removed or renamed.</p>
        <Link
          to="/catalog"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition-all hover:border-ink hover:bg-ink hover:text-canvas"
        >
          <IconChevronLeft className="h-4 w-4" /> Back to catalog
        </Link>
      </div>
    )
  }

  const outOfStock = product.stock_status === 'no_stock'
  const images = product.images.length > 0 ? product.images : [null]
  const current = images[Math.min(activeImage, images.length - 1)]

  const handleAdd = () => {
    if (outOfStock) return
    const img = document.querySelector<HTMLImageElement>('[data-main-image]')
    if (img) {
      const r = img.getBoundingClientRect()
      fly({ x: r.left, y: r.top, width: r.width, height: r.height }, product.images[0] ?? null)
    }
    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.images[0] ?? null,
        stock_status: product.stock_status,
      },
      qty,
    )
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
          {product.categories && (
            <>
              <li aria-hidden>·</li>
              <li>
                <Link to={`/category/${product.categories.slug}`} className="hover:text-ink">
                  {product.categories.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>·</li>
          <li className="text-ink" aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div>
          <div className="media-frame relative aspect-[4/5] w-full">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                data-main-image
                src={current ? responsiveImage(current, 900) : undefined}
                alt={product.name}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full w-full object-cover"
              />
            </AnimatePresence>
            <div className="absolute left-4 top-4">
              <StockBadge status={product.stock_status} />
            </div>
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1}`}
                  className={
                    'h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ' +
                    (i === activeImage
                      ? 'border-pine shadow-card'
                      : 'border-transparent opacity-60 hover:opacity-100')
                  }
                >
                  {src ? (
                    <img src={responsiveImage(src, 200)} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center bg-pine-soft"><IconImage className="h-5 w-5 text-pine" /></span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {product.categories && (
            <Link
              to={`/category/${product.categories.slug}`}
              className="eyebrow uppercase transition-colors hover:text-brass-dark"
            >
              {product.categories.name}
            </Link>
          )}
          {product.brands && (
            <Link
              to={`/brand/${product.brands.slug}`}
              className="eyebrow uppercase transition-colors hover:text-brass-dark"
            >
              {product.brands.name}
            </Link>
          )}
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
            {product.name}
          </h1>
          <div className="mt-4 flex items-center gap-3">
            <span className="font-display text-2xl text-pine">{formatPrice(product.price)}</span>
            <StockBadge status={product.stock_status} />
          </div>

          {product.description && (
            <p className="mt-6 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
              {product.description}
            </p>
          )}

          {product.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-canvas-deep px-3 py-1 text-xs font-medium text-ink-soft"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-ink/8 pt-6">
            <QuantityStepper value={qty} onChange={setQty} min={1} />
            <Button size="lg" className="flex-1 sm:flex-none sm:min-w-56" onClick={handleAdd} disabled={outOfStock}>
              {outOfStock ? 'Out of stock' : 'Add to basket'}
            </Button>
          </div>

          {!outOfStock && (
            <Button
              variant="whatsapp"
              size="lg"
              className="mt-3 sm:self-start"
              onClick={() => {
                handleAdd()
                openCart()
              }}
            >
              <IconWhatsApp className="h-5 w-5" /> Order this on WhatsApp
            </Button>
          )}

          <p className="mt-8 text-xs leading-relaxed text-ink-muted">
            Checkout happens over WhatsApp — add items to your basket, send your order, and we'll
            confirm price, availability and delivery in chat. No online payment.
          </p>
        </div>
      </div>

      {/* Related products */}
      {related.data.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-semibold text-ink">You might also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {related.data.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}