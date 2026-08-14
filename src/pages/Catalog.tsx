import { useSearchParams } from 'react-router-dom'
import { useBrands, useBrandsCapable, useCategories, useProducts } from '../hooks/useData'
import { useSeo } from '../lib/seo'
import { ProductGrid } from '../components/catalog/ProductGrid'
import { CategoryBento } from '../components/catalog/CategoryBento'
import { TitlePlate } from '../components/ui/TitlePlate'
import { LinkButton } from '../components/ui/Button'
import { IconChevronDown, IconSearch } from '../components/ui/Icons'
import { cn } from '../lib/utils'
import type { SortKey } from '../lib/types'
import type { Brand, Category } from '../lib/types'

const SORT_LABELS: Record<SortKey, string> = {
  featured: 'featured',
  price_asc: 'price low to high',
  price_desc: 'price high to low',
}

const CYCLE: SortKey[] = ['featured', 'price_asc', 'price_desc']

const chipStrip =
  'flex min-w-0 flex-1 items-center gap-[8px] overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] snap-x snap-proximity ' +
  '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden ' +
  '[mask-image:linear-gradient(90deg,#000_calc(100%_-_24px),transparent)] ' +
  'lg:flex-wrap lg:overflow-visible lg:snap-none lg:[mask-image:none]'

function chipClass(active: boolean) {
  return cn(
    'inline-flex shrink-0 snap-start min-h-[44px] items-center gap-[7px] rounded-full border px-4 text-[13.5px] font-medium transition-all',
    active
      ? 'border-ink bg-ink text-paper-2'
      : 'border-line bg-card text-ink hover:border-ink/40 hover:text-ink',
  )
}

function Chip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={chipClass(active)}>
      {label}
      <span className={cn('font-mono text-[11.5px]', active ? 'text-blue' : 'text-ink-faint')}>{count}</span>
    </button>
  )
}

function AllChip({ active, onSelect }: { active: boolean; onSelect: () => void }) {
  const { count } = useProducts(undefined, undefined, 1)
  return <Chip label="All" count={count} active={active} onClick={onSelect} />
}

function CategoryChip({ category, active, onSelect }: { category: Category; active: boolean; onSelect: () => void }) {
  const { count } = useProducts(category.slug, undefined, 1)
  return <Chip label={category.name} count={count} active={active} onClick={onSelect} />
}

function BrandChip({ brand, active, onSelect }: { brand: Brand; active: boolean; onSelect: () => void }) {
  const { count } = useProducts(undefined, undefined, 1, brand.slug)
  return <Chip label={brand.name} count={count} active={active} onClick={onSelect} />
}

export function Catalog() {
  const [params, setParams] = useSearchParams()
  const category = params.get('category') ?? undefined
  const brand = params.get('brand') ?? undefined
  const sortParam = params.get('sort')
  const sort: SortKey =
    sortParam === 'price_asc' || sortParam === 'price_desc' ? sortParam : 'featured'

  const { data: categories } = useCategories()
  const { data: brands } = useBrands()
  const { data: brandsCapable } = useBrandsCapable()
  const products = useProducts(category, undefined, 12, brand, sort)

  useSeo({
    title: 'All Products',
    description: 'Browse the full catalog — every product, filterable by category and brand.',
    canonicalPath: '/catalog',
  })

  const setFilter = (key: 'category' | 'brand' | 'sort', value: string | undefined) => {
    const next = new URLSearchParams(params)
    if (value === undefined) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const cycleSort = () => {
    const next = CYCLE[(CYCLE.indexOf(sort) + 1) % CYCLE.length]
    setFilter('sort', next)
  }

  return (
    <div className="container-site pb-20 pt-10 sm:pt-14">
      <TitlePlate words={['All', 'products']} count={products.count} countLabel="in stock now">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className={chipStrip}>
            <AllChip active={!category} onSelect={() => setFilter('category', undefined)} />
            {categories.map((c) => (
              <CategoryChip
                key={c.id}
                category={c}
                active={category === c.slug}
                onSelect={() => setFilter('category', category === c.slug ? undefined : c.slug)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={cycleSort}
            aria-label={`Sort: ${SORT_LABELS[sort]}`}
            className="ml-auto inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border border-line bg-card px-5 text-[13.5px] font-medium text-ink transition-all hover:border-ink/40 hover:text-ink"
          >
            Sort: {SORT_LABELS[sort]} <IconChevronDown className="h-4 w-4" />
          </button>
        </div>

        {brandsCapable && brands.length > 0 && (
          <div className={cn(chipStrip, 'mt-3')}>
            {brands.map((b) => (
              <BrandChip
                key={b.id}
                brand={b}
                active={brand === b.slug}
                onSelect={() => setFilter('brand', brand === b.slug ? undefined : b.slug)}
              />
            ))}
          </div>
        )}
      </TitlePlate>

      <div className="mt-10">
        <CategoryBento />
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
          <p className="mt-2 text-sm text-ink-faint">
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