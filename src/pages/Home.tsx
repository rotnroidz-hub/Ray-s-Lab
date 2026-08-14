import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useBanners, useCategories, useProducts } from '../hooks/useData'
import { useSeo } from '../lib/seo'
import { responsiveImage } from '../lib/image'
import { LinkButton } from '../components/ui/Button'
import { ProductCard } from '../components/catalog/ProductCard'
import { CategoryTile } from '../components/catalog/CategoryTile'
import { ProductGridSkeleton } from '../components/ui/Skeleton'
import { Reveal } from '../components/ui/Reveal'
import { IconArrowRight, IconChevronLeft, IconChevronRight } from '../components/ui/Icons'
import type { Banner } from '../lib/types'

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

export function Home() {
  useSeo({ title: undefined, canonicalPath: '/' })
  const { data: categories } = useCategories()
  const products = useProducts(undefined, undefined, 8)

  return (
    <div className="container-site">
      <section className="pb-14 pt-4 sm:pt-8">
        <HeroCarousel />
      </section>

      <section className="section-band -mx-4 rounded-2xl px-4 py-10 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 sm:py-14">
        <Reveal>
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Featured</p>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl">New arrivals</h2>
            </div>
            <LinkButton to="/catalog" variant="ghost" className="text-sm">
              View all <IconArrowRight className="h-4 w-4" />
            </LinkButton>
          </div>
        </Reveal>
        <div className="mt-6">
          {products.loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {products.data.slice(0, 4).map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <Reveal>
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Browse</p>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl">Shop by category</h2>
            </div>
            <LinkButton to="/catalog" variant="ghost" className="text-sm">
              All products <IconArrowRight className="h-4 w-4" />
            </LinkButton>
          </div>
        </Reveal>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c, i) => (
            <CategoryTile key={c.id} category={c} index={i} />
          ))}
        </div>
      </section>
    </div>
  )
}
