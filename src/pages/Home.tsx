import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useBanners, useBestSellers, useFeaturedProducts } from '../hooks/useData'
import { useSeo } from '../lib/seo'
import { responsiveImage } from '../lib/image'
import { formatPrice } from '../lib/utils'
import { LinkButton } from '../components/ui/Button'
import { TitlePlate } from '../components/ui/TitlePlate'
import { Reveal } from '../components/ui/Reveal'
import { CategoryBento } from '../components/catalog/CategoryBento'
import { useCart } from '../hooks/useCart'
import { useFlyToCart } from '../components/cart/FlyToCart'
import { IconArrowRight, IconCart, IconChevronLeft, IconChevronRight } from '../components/ui/Icons'
import type { Banner, Product } from '../lib/types'

function BannerButtons({ banner }: { banner: Banner }) {
  const cta = banner.cta_label?.trim()
  const cta2 = banner.cta2_label?.trim()
  const ctaUrl = banner.link_url?.trim()
  const cta2Url = banner.cta2_url?.trim()

  const render = (label: string | undefined, url: string | undefined, variant: 'primary' | 'ghost-dark') => {
    if (!label || !url) return null
    if (/^https?:\/\//i.test(url)) {
      return (
        <a
          href={url}
          className="inline-flex items-center gap-2 rounded-full bg-blue px-6 py-3 text-sm font-medium text-white shadow-[0_6px_20px_rgba(0,144,230,0.28)] transition-all hover:bg-[#0a9ff5] active:translate-y-[1px]"
        >
          {label}
        </a>
      )
    }
    return <LinkButton to={url} variant={variant}>{label}</LinkButton>
  }

  return (
    <div className="flex flex-wrap gap-3">
      {render(cta, ctaUrl, 'primary')}
      {render(cta2, cta2Url, 'ghost-dark')}
    </div>
  )
}

function HeroCarousel() {
  const { data: banners } = useBanners()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const reduce = useRef(false)

  useEffect(() => {
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useLayoutEffect(() => {
    const el = trackRef.current
    if (!el) return
    const measure = () => setWidth(el.offsetWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Auto-advance every 6500ms. Pauses on hover/focus, stops under reduced motion.
  useEffect(() => {
    if (banners.length < 2 || paused || reduce.current) return
    const t = window.setInterval(() => setIndex((i) => (i + 1) % banners.length), 6500)
    return () => window.clearInterval(t)
  }, [banners.length, paused])

  if (banners.length === 0) {
    return (
      <section className="relative grid min-h-[440px] place-items-center overflow-hidden rounded-[18px] bg-ink p-8 text-center lg:min-h-[520px]">
        <div className="tex-dark" aria-hidden style={{ opacity: 0.9 }} />
        <div className="relative z-[2]">
          <p className="eyebrow text-paper/70">The catalog</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-paper sm:text-5xl">
            Add a hero banner in the admin
          </h1>
          <Link
            to="/admin/banners"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue px-6 py-3 text-sm font-medium text-white transition-all hover:bg-[#0a9ff5] active:translate-y-[1px]"
          >
            Manage banners <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    )
  }

  const navigate = (next: number) => {
    setIndex(((next % banners.length) + banners.length) % banners.length)
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Promotions"
      className="relative overflow-hidden rounded-[18px] bg-ink"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <motion.div
        ref={trackRef}
        className="flex min-h-[440px] lg:min-h-[520px]"
        animate={{ x: -index * width }}
        transition={{ type: 'tween', duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          if (info.offset.x < -50 || info.velocity.x < -300) navigate(index + 1)
          else if (info.offset.x > 50 || info.velocity.x > 300) navigate(index - 1)
        }}
        style={{ touchAction: 'pan-y' }}
      >
        {banners.map((b, i) => (
          <div key={b.id} className="grid w-full shrink-0 grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Copy panel – no photo, so the hexagon texture belongs here */}
            <div className="relative flex min-h-[440px] items-center overflow-hidden bg-ink px-[clamp(30px,4.4vw,62px)] py-16 lg:min-h-[520px]">
              <div className="tex-dark" aria-hidden style={{ opacity: 0.9 }} />
              <div className="tex-glow" aria-hidden style={{ opacity: 0.32 }} />
              <div
                aria-hidden
                className="pointer-events-none absolute -top-[140px] right-[18%] h-[520px] w-[520px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(0,144,230,0.42), transparent 68%)' }}
              />
              <div className="relative z-[2]">
                {b.eyebrow?.trim() ? (
                  <p className="mb-[18px] font-mono text-[11.5px] uppercase tracking-[0.16em] text-blue-lite">
                    {b.eyebrow}
                  </p>
                ) : null}
                <h2 className="font-display text-[clamp(32px,4.3vw,56px)] leading-[1.05] text-paper-2 max-w-[15ch]">
                  {b.title}
                </h2>
                {b.subtitle?.trim() ? (
                  <p className="mt-4 max-w-[42ch] text-[15.5px] leading-[1.6] text-paper-2/[0.66]">
                    {b.subtitle}
                  </p>
                ) : null}
                <div className="mt-[28px]">
                  <BannerButtons banner={b} />
                </div>
              </div>
            </div>

            {/* Photo – absolutely no hexagon texture over this column */}
            <div className="relative hidden overflow-hidden lg:block">
              <img
                src={responsiveImage(b.image_url, 1600)}
                alt=""
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : undefined}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(90deg, #0E1013 0%, rgba(14,16,19,0.35) 45%, transparent 100%)',
                }}
              />
            </div>
          </div>
        ))}
      </motion.div>

      {/* Controls, bottom-left, aligned to the copy padding */}
      {banners.length > 1 && (
        <div className="absolute bottom-[26px] left-[clamp(30px,4.4vw,62px)] z-[5] flex items-center gap-[14px]">
          <div className="flex items-center gap-1">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => navigate(i)}
                aria-current={i === index}
                aria-label={`Go to slide ${i + 1}`}
                className="grid h-11 w-11 place-items-center"
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-300 ${
                    i === index ? 'w-[26px] bg-blue' : 'w-2 bg-paper-2/[0.32]'
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-[7px] lg:flex">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => navigate(index - 1)}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/26 bg-white/[0.07] text-paper-2 transition-colors hover:bg-white/[0.18]"
            >
              <IconChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => navigate(index + 1)}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/26 bg-white/[0.07] text-paper-2 transition-colors hover:bg-white/[0.18]"
            >
              <IconChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

/** Handpicked editorial card. Full card links to the product. */
function FeaturedCard({ product }: { product: Product }) {
  const brand = product.brands?.name
  const category = product.categories?.name
  const line = [brand, category].filter(Boolean).join(' · ')
  const description = product.description.slice(0, 120)
  const truncated = product.description.length > 120

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group relative flex min-h-[360px] flex-col justify-end overflow-hidden rounded-tile p-[26px_24px] text-paper-2 lg:min-h-[440px]"
    >
      {product.images[0] ? (
        <img
          src={responsiveImage(product.images[0], 1100)}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      ) : null}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(14,16,19,0.28) 0%, rgba(14,16,19,0.62) 48%, rgba(14,16,19,0.96) 100%)',
        }}
      />
      <span className="absolute right-[18px] top-[18px] z-[2] rounded-full bg-white/[0.14] px-3 py-2 font-mono text-[13px] text-paper-2 backdrop-blur-[6px]">
        {formatPrice(product.price)}
      </span>

      <div className="relative z-[2]">
        {line ? (
          <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-paper-2/[0.72]">{line}</p>
        ) : null}
        <h3 className="mt-2 font-display text-[clamp(23px,2.4vw,30px)] leading-[1.05] text-paper-2">
          {product.name}
        </h3>
        {product.description ? (
          <p className="mt-2 max-w-[36ch] text-[14.5px] leading-[1.55] text-paper-2/[0.72]">
            {description}
            {truncated ? '...' : ''}
          </p>
        ) : null}
        <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-blue px-6 py-3 text-sm font-medium text-white shadow-[0_6px_20px_rgba(0,144,230,0.28)] transition-colors hover:bg-[#0a9ff5]">
          View product <IconArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  )
}

/** One rail card: square cover with rank, then brand, name, price and the buy/add pair. */
function BestSellerCard({ product, rank }: { product: Product; rank: number }) {
  const { addItem, openCart } = useCart()
  const fly = useFlyToCart()
  const outOfStock = product.stock_status === 'no_stock'
  const image = product.images[0] ?? null

  const handleAdd = (e: React.MouseEvent) => {
    if (outOfStock) return
    const node = (e.currentTarget as HTMLElement).closest<HTMLElement>('.best-card')
    const img = node?.querySelector('img')
    if (img) {
      const r = img.getBoundingClientRect()
      fly({ x: r.left, y: r.top, width: r.width, height: r.height }, image)
    }
    addItem(
      { id: product.id, name: product.name, slug: product.slug, price: product.price, image, stock_status: product.stock_status },
      1,
    )
  }

  const handleBuyNow = () => {
    if (outOfStock) return
    addItem(
      { id: product.id, name: product.name, slug: product.slug, price: product.price, image, stock_status: product.stock_status },
      1,
    )
    openCart()
  }

  return (
    <article className="best-card edge group flex h-full flex-col overflow-hidden rounded-card bg-card transition-shadow duration-200 hover:shadow-lift">
      <Link to={`/product/${product.slug}`} className="block focus:outline-none" aria-label={product.name}>
        <div className="relative aspect-square overflow-hidden bg-paper">
          {image ? (
            <img
              src={responsiveImage(image, 600)}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-paper-2 text-ink/25">
              <span className="font-display text-4xl">·</span>
            </div>
          )}
          <span
            aria-hidden
            className="absolute left-[14px] top-[10px] font-display text-[54px] font-extrabold leading-none text-paper-2"
            style={{ textShadow: '0 2px 18px rgba(14,16,19,0.5)' }}
          >
            {rank}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-[15px_17px_18px]">
        {product.brands?.name && (
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">
            {product.brands.name}
          </span>
        )}
        <h3 className="line-clamp-2 text-[14.5px] font-medium leading-snug text-ink">{product.name}</h3>
        <span className="mt-1.5 font-mono text-base font-medium text-ink">{formatPrice(product.price)}</span>
        <div className="mt-auto flex gap-[7px] pt-3">
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={outOfStock}
            className="inline-flex h-10 items-center justify-center rounded-full bg-ink px-4 text-[13px] font-medium text-paper-2 transition-colors hover:bg-ink-2 disabled:pointer-events-none disabled:opacity-40"
          >
            Buy now
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={outOfStock}
            aria-label={`Add ${product.name} to cart`}
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card text-ink transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-40"
          >
            <IconCart className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  )
}

/** Best sellers rail, fully derived from checkout events. Hidden below 2 items. */
function BestSellersRail() {
  const { data: bestSellers } = useBestSellers(6)
  const railRef = useRef<HTMLDivElement>(null)
  if (bestSellers.length < 2) return null

  const scroll = (dir: 1 | -1) => {
    railRef.current?.scrollBy({ left: 314 * dir, behavior: 'smooth' })
  }

  return (
    <section className="pb-14">
      <TitlePlate
        kicker="Moving fastest right now"
        words={['Best', 'sellers']}
        count={bestSellers.length}
        countLabel="this month"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="max-w-[52ch] text-[15.5px] text-ink-soft">
            Ranked by what actually left the shelf over the last seven days.
          </p>
          <div className="ml-auto flex gap-[7px] [@media(hover:none)]:hidden">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Scroll best sellers left"
              className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-ink transition-colors hover:bg-ink hover:text-paper-2 hover:border-ink"
            >
              <IconChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Scroll best sellers right"
              className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-ink transition-colors hover:bg-ink hover:text-paper-2 hover:border-ink"
            >
              <IconChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </TitlePlate>

      <div
        ref={railRef}
        className="mt-8 flex snap-x snap-mandatory gap-[14px] overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {bestSellers.map((p, i) => (
          <Reveal
            key={p.id}
            index={i}
            className="flex h-full flex-[0_0_300px] shrink-0 snap-start max-sm:flex-[0_0_78vw]"
          >
            <BestSellerCard product={p} rank={i + 1} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function Home() {
  useSeo({ title: undefined, canonicalPath: '/' })
  const { data: featured } = useFeaturedProducts(2)
  const showHandpicked = featured.length > 0

  return (
    <div className="container-site">
      <section className="pb-14 pt-4 sm:pt-8">
        <HeroCarousel />
      </section>

      {showHandpicked && (
        <section className="pb-14">
          <TitlePlate
            kicker="Handpicked this week"
            words={['Chosen,', 'not', 'churned.']}
            count={featured.length}
            countLabel="picks"
          >
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <p className="max-w-[52ch] text-[15.5px] text-ink-soft">
                The two pieces our customers message about most, week after week.
              </p>
              <LinkButton to="/catalog" variant="outline">
                See all products
              </LinkButton>
            </div>
          </TitlePlate>

          <div
            className={`mt-8 grid grid-cols-1 gap-[14px] ${
              featured.length === 1 ? 'lg:grid-cols-1' : 'lg:grid-cols-[1.35fr_1fr]'
            }`}
          >
            {featured.map((p, i) => (
              <Reveal key={p.id} index={i}>
                <FeaturedCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <CategoryBento />
      <BestSellersRail />
    </div>
  )
}
