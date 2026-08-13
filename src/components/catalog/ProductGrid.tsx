import type { Product } from '../../lib/types'
import { ProductCard } from './ProductCard'
import { ProductGridSkeleton } from '../ui/Skeleton'

interface ProductGridProps {
  products: Product[]
  loading?: boolean
  skeletonCount?: number
  hasMore?: boolean
  onLoadMore?: () => void
}

export function ProductGrid({ products, loading, skeletonCount = 8, hasMore, onLoadMore }: ProductGridProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {loading && products.length === 0 ? (
          <ProductGridSkeleton count={skeletonCount} />
        ) : (
          products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
        )}
      </div>

      {hasMore && !loading && (
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={onLoadMore}
            className="rounded-full border border-ink/20 px-8 py-3 text-sm font-semibold text-ink transition-all hover:border-ink hover:bg-ink hover:text-paper active:scale-[0.98]"
          >
            Load more products
          </button>
        </div>
      )}

      {loading && products.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          <ProductGridSkeleton count={skeletonCount} />
        </div>
      )}
    </>
  )
}