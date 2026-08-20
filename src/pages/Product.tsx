import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useProduct, useRelatedProducts } from '../hooks/useData'
import { useCart } from '../hooks/useCart'
import { useFlyToCart } from '../components/cart/FlyToCart'
import { useToast } from '../components/ui/Toast'
import { productJsonLd, useSeo } from '../lib/seo'
import { cn, formatPrice } from '../lib/utils'
import { responsiveImage } from '../lib/image'
import { StockBadge } from '../components/ui/StockBadge'
import { QuantityStepper } from '../components/ui/QuantityStepper'
import { Button } from '../components/ui/Button'
import { ProductCard } from '../components/catalog/ProductCard'
import { TitlePlate } from '../components/ui/TitlePlate'
import { Skeleton } from '../components/ui/Skeleton'
import { IconChevronLeft, IconImage, IconCart, IconWhatsApp } from '../components/ui/Icons'

function ProductBlock({
  heading,
  note,
  body,
  last,
}: {
  heading: string
  note?: string
  body: string | null
  last?: boolean
}) {
  const lines = (body ?? '')
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const isList = lines.length > 0 && lines.some((line) => /^[-•*]/.test(line))

  return (
    <div className={cn('border-t border-line py-5', last && 'pb-0')}>
      <h5 className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
        {heading}
        {note ? (
          <em className="ml-1 normal-case tracking-[0.02em] text-blue-deep not-italic">{note}</em>
        ) : null}
      </h5>
      {body?.trim() ? (
        isList ? (
          <ul className="max-w-[48ch] pl-[18px]">
            {lines.map((item, i) => (
              <li key={i} className="mb-1.5 text-[14.5px] leading-[1.68] text-ink-soft last:mb-0">
                {item.replace(/^[-•*]\s*/, '')}
              </li>
            ))}
          </ul>
        ) : (
          <p className="max-w-[48ch] whitespace-pre-line text-[14.5px] leading-[1.68] text-ink-soft">
            {body}
          </p>
        )
      ) : (
        <p className="text-[13.5px] italic text-ink-faint">
          Not filled in yet. Add this from the admin.
        </p>
      )}
    </div>
  )
}

export function Product() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { data: product, loading, error } = useProduct(slug)
  const related = useRelatedProducts(product)
  const { addItem, openCheckout, openCart } = useCart()
  const fly = useFlyToCart()
  const { showToast } = useToast()
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const galleryRef = useRef<HTMLDivElement>(null)
  const [showStickyBar, setShowStickyBar] = useState(false)

  // The sticky action bar (below lg) appears once the main gallery is out of
  // view. The observer is kept observing (never unobserve) so the bar tracks
  // scrolling in both directions.
  useEffect(() => {
    const el = galleryRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [product?.id])

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
        <p className="mt-2 text-sm text-ink-faint">It may have been removed or renamed.</p>
        <Link
          to="/catalog"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition-all hover:border-ink hover:bg-ink hover:text-paper"
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
    showToast(`${product.name} added to cart`)
  }

  const handleBuyNow = () => {
    if (outOfStock) return
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
    openCheckout()
  }

  return (
    <div className="container-site pb-24 lg:pb-0">
      <div className="mt-6 overflow-hidden rounded-[18px] bg-paper-2">
        <div className="grid lg:grid-cols-[1.05fr_1fr]">
          {/* Gallery */}
          <div ref={galleryRef} className="flex flex-col gap-3 bg-paper p-[clamp(20px,3vw,40px)]">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card bg-paper-2">
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
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-3 gap-3">
                {images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`View image ${i + 1}`}
                    className={
                      'aspect-square overflow-hidden rounded-[10px] border-2 transition-all ' +
                      (i === activeImage
                        ? 'border-blue shadow-card'
                        : 'border-transparent opacity-60 hover:opacity-100')
                    }
                  >
                    {src ? (
                      <img src={responsiveImage(src, 200)} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center bg-paper-2"><IconImage className="h-5 w-5 text-ink" /></span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-paper-2 px-[clamp(22px,3vw,44px)] py-[clamp(24px,3vw,46px)]">
            <nav
              aria-label="Breadcrumb"
              className="mb-4 font-mono text-[11.5px] uppercase tracking-[0.1em] text-ink-faint"
            >
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <li>
                  <Link to="/catalog" className="transition-colors hover:text-ink">Catalog</Link>
                </li>
                {product.categories && (
                  <>
                    <li aria-hidden>/</li>
                    <li>
                      <Link to={`/category/${product.categories.slug}`} className="text-blue-deep transition-colors hover:text-ink">
                        {product.categories.name}
                      </Link>
                    </li>
                  </>
                )}
              </ol>
            </nav>

            <h1 className="mb-2.5 font-display text-[clamp(26px,2.9vw,38px)] leading-[1.05] text-ink">
              {product.name}
            </h1>

            <div className="mb-1.5 mt-[18px] flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-[28px] font-medium text-ink">
                {formatPrice(product.price)}
              </span>
            </div>

            <div className="mb-[22px]">
              <StockBadge status={product.stock_status} />
            </div>

            {product.description && (
              <p className="mb-6 max-w-[48ch] whitespace-pre-line text-[15px] leading-[1.68] text-ink-soft">
                {product.description}
              </p>
            )}

            <div className="mb-[26px] flex flex-wrap items-center gap-4">
              <QuantityStepper value={qty} onChange={setQty} min={1} />
              <Button variant="dark" size="lg" className="flex-1 sm:flex-none sm:min-w-56" onClick={handleBuyNow} disabled={outOfStock}>
                {outOfStock ? 'Out of stock' : 'Buy now'}
              </Button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={outOfStock}
                aria-label={outOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
                className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-full border border-line bg-card text-ink transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-40"
              >
                <IconCart className="h-6 w-6" />
              </button>
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

            <p className="mt-8 max-w-[48ch] text-xs leading-relaxed text-ink-faint">
              Checkout happens over WhatsApp: add items to your basket, send your order, and we will
              confirm price, availability and delivery in chat. No online payment.
            </p>

            <ProductBlock heading="Benefits" body={product.benefits} />
            <ProductBlock
              heading="Dos and cycle"
              note="(for reference only)"
              body={product.dosage_cycle}
            />
            <ProductBlock heading="Note" body={product.product_note} last />
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.data.length > 0 && (
        <section className="mt-20">
          <TitlePlate words={['You', 'might', 'also', 'like']} />
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {related.data.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky action bar, below lg only. Risen once the gallery is out of view. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper-2/95 backdrop-blur transition-transform duration-300 lg:hidden ${
          showStickyBar ? '' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="shrink-0 font-mono text-[17px] font-medium text-ink">
            {formatPrice(product.price)}
          </span>
          <Button
            variant="outline"
            className="h-12 min-w-0 flex-1 px-4 text-[13px]"
            onClick={handleAdd}
            disabled={outOfStock}
            aria-label={`Add ${product.name} to cart`}
          >
            Add to cart
          </Button>
          <Button
            variant="dark"
            className="h-12 min-w-0 flex-1 px-4 text-[13px]"
            onClick={handleBuyNow}
            disabled={outOfStock}
          >
            {outOfStock ? 'No Stock' : 'Buy now'}
          </Button>
        </div>
      </div>
    </div>
  )
}
