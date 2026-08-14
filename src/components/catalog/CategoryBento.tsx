import { Link } from 'react-router-dom'
import { useCategories, useProducts } from '../../hooks/useData'
import { responsiveImage } from '../../lib/image'
import { TitlePlate } from '../ui/TitlePlate'
import { Reveal } from '../ui/Reveal'
import { LinkButton } from '../ui/Button'
import { IconArrowRight } from '../ui/Icons'
import type { Category } from '../../lib/types'

/** Category bento tile. Flat ink fallback when the category has no image. */
function CategoryBentoTile({ category }: { category: Category }) {
  const { count } = useProducts(category.slug, undefined, 1)

  return (
    <Link
      to={`/category/${category.slug}`}
      className="group relative flex min-h-[190px] items-end overflow-hidden rounded-tile p-6 text-paper-2 lg:h-full"
    >
      {category.image_url ? (
        <img
          src={responsiveImage(category.image_url, 900)}
          alt={category.name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
        />
      ) : (
        <>
          <div aria-hidden className="tex-dark absolute inset-0" style={{ opacity: 0.4 }} />
          <div aria-hidden className="tex-glow absolute inset-0" style={{ opacity: 0.14 }} />
        </>
      )}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(14,16,19,0.18) 0%, rgba(14,16,19,0.5) 45%, rgba(14,16,19,0.9) 100%)',
        }}
      />

      <div className="relative z-[2]">
        <h3 className="font-display text-[24px] text-paper-2">{category.name}</h3>
        <p className="mt-1 font-mono text-[12px] text-blue-lite">
          {count} item{count === 1 ? '' : 's'}
        </p>
      </div>
    </Link>
  )
}

/** Category bento grid. Matches the cell count to the category count, never an empty cell. */
export function CategoryBento() {
  const { data: categories } = useCategories()
  const total = categories.length
  if (total === 0) return null

  const layout =
    total === 1
      ? 'lg:grid-rows-1'
      : total === 2
        ? 'lg:grid-cols-2 lg:grid-rows-1'
        : total === 3
          ? 'lg:grid-cols-[1.4fr_1fr] lg:grid-rows-2'
          : 'lg:grid-cols-2 lg:grid-rows-2'
  const shown = total === 1 ? 1 : total <= 4 ? total : 4

  return (
    <section className="pb-14">
      <TitlePlate
        kicker="Browse the store"
        words={['Shop', 'by', 'category.']}
        count={total}
        countLabel="categories"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="max-w-[52ch] text-[15.5px] text-ink-soft">
            Everything we stock, organised so it is easy to find your thing.
          </p>
          <LinkButton to="/catalog" variant="outline">
            All products <IconArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>
      </TitlePlate>

      <div className={`mt-8 grid grid-cols-1 gap-[14px] lg:h-[470px] ${layout}`}>
        {categories.slice(0, shown).map((c, i) => (
          <Reveal
            key={c.id}
            index={i}
            className={total === 3 && i === 0 ? 'lg:row-span-2' : undefined}
          >
            <CategoryBentoTile category={c} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}