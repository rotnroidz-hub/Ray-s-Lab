import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { useBanners, useCategories, useProducts } from '../hooks/useData'
import { useSeo } from '../lib/seo'
import { responsiveImage } from '../lib/image'
import { LinkButton } from '../components/ui/Button'
import { ProductCard } from '../components/catalog/ProductCard'
import { CategoryTile } from '../components/catalog/CategoryTile'
import { ProductGridSkeleton } from '../components/ui/Skeleton'
import { Reveal } from '../components/ui/Reveal'
import { IconArrowRight, IconChevronLeft, IconChevronRight } from '../components/ui/Icons'

function HeroCarousel() {
  const { data: banners } = useBanners()
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(1)
  const sectionRef = useRef<HTMLElement>(null)

  // Subtle parallax: the banner image drifts up slightly slower than the page.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 48])
  const scrimY = useTransform(scrollYProgress, [0, 1], [0, -24])

  useEffect(() => {
    if (banners.length < 2) return
    const t = window.setInterval(() => {
      setDir(1)
      setIndex((i) => (i + 1) % banners.length)
    }, 6000)
    return () => window.clearInterval(t)
  }, [banners.length])

  if (banners.length === 0) {
    return (
      <section
        ref={sectionRef}
        className="media-frame relative aspect-[4/3] max-h-[70vh] w-full bg-ink sm:aspect-[21/9]"
      >
        <div className="absolute inset-0 grid place-items-center p-8 text-center">
          <div>
            <p className="eyebrow text-paper/70">The catalog</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-paper sm:text-5xl">
              Add a hero banner in the admin
            </h1>
          </div>
        </div>
      </section>
    )
  }

  const navigate = (next: number) => {
    setDir(next >= index ? 1 : -1)
    setIndex((((next % banners.length) + banners.length) % banners.length))
  }

  return (
    <section
      ref={sectionRef}
      className="group relative overflow-hidden rounded-3xl bg-ink"
      aria-roledescription="carousel"
    >
      <div className="relative aspect-[4/3] max-h-[70vh] w-full sm:aspect-[21/9]">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={banners[index].id}
            custom={dir}
            initial={{ opacity: 0, x: dir * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -60 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {/* Slight overscan so the parallax drift never reveals an edge. */}
            <motion.img
              src={responsiveImage(banners[index].image_url, 1600)}
              alt=""
              loading="eager"
              style={{ y: imageY }}
              className="h-[112%] w-full -translate-y-[6%] scale-[1.02] object-cover"
            />
            <motion.div
              style={{ y: scrimY }}
              className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
              <motion.p
                className="eyebrow text-paper/80"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {banners[index].subtitle}
              </motion.p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-paper sm:text-5xl">
                {banners[index].title}
              </h2>
              {(banners[index].link_url || '').trim() ? (
                <Link
                  to={banners[index].link_url}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] active:scale-95"
                >
                  Shop now <IconArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Swipe/directional controls */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => navigate(index - 1)}
            className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-paper/80 text-ink opacity-0 backdrop-blur transition-opacity duration-300 hover:bg-paper group-hover:opacity-100 max-sm:opacity-100"
          >
            <IconChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => navigate(index + 1)}
            className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-paper/80 text-ink opacity-0 backdrop-blur transition-opacity duration-300 hover:bg-paper group-hover:opacity-100 max-sm:opacity-100"
          >
            <IconChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 right-6 flex gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => navigate(i)}
                className="h-1.5 rounded-full bg-paper/40 transition-all duration-300 aria-[current=true]:w-6 aria-[current=true]:bg-paper"
                style={{ width: i === index ? 24 : 6 }}
              />
            ))}
          </div>
        </>
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
