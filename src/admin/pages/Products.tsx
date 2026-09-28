import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteProductAdmin, listProductsAdmin } from '../../lib/adminApi'
import { useSeo } from '../../lib/seo'
import { formatPrice, cn } from '../../lib/utils'
import { responsiveImage } from '../../lib/image'
import type { Product } from '../../lib/types'
import { StockBadge } from '../../components/ui/StockBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import { IconEdit, IconPlus, IconTrash } from '../../components/ui/Icons'

export default function Products() {
  useSeo({ title: 'Products', robots: 'noindex,follow' })
  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function load() {
    try {
      setProducts(await listProductsAdmin())
    } catch (err) {
      setError((err as Error).message)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function remove(id: string) {
    setDeletingId(id)
    try {
      await deleteProductAdmin(id)
      setProducts((prev) => prev?.filter((p) => p.id !== id) ?? null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Products</h1>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper transition-all hover:bg-ink-2 active:scale-[0.98]"
        >
          <IconPlus className="h-4 w-4" /> New product
        </Link>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-2xl bg-stock-no/10 px-4 py-3 text-sm text-stock-no">
          {error} — check your session and RLS policies.
        </p>
      )}

      <div className="mt-8 space-y-3">
        {products === null && (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        )}

        {products?.length === 0 && (
          <p className="rounded-2xl border border-ink/10 p-10 text-center text-sm text-ink-faint">
            No products yet — create your first one.
          </p>
        )}

        {products?.map((p) => (
          <div
            key={p.id}
            className={`flex flex-wrap items-center gap-4 rounded-2xl border p-3 transition-colors ${
              deletingId === p.id
                ? 'border-stock-no/30 bg-stock-no-soft hover:border-stock-no/30'
                : 'border-ink/10 bg-paper-2 hover:border-ink/30'
            }`}
          >
            {confirmId === p.id ? (
              <div className="flex w-full items-center gap-2 text-sm font-semibold text-stock-no">
                Delete this?
                <button
                  type="button"
                  onClick={() => setConfirmId(null)}
                  disabled={deletingId === p.id}
                  className="ml-auto rounded-lg px-2 py-1 font-medium text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-40 max-lg:min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void remove(p.id)}
                  disabled={deletingId === p.id}
                  className="rounded-lg bg-stock-no px-2 py-1 font-medium text-paper transition-colors hover:brightness-95 disabled:opacity-40 max-lg:min-h-[44px]"
                >
                  Delete
                </button>
              </div>
            ) : (
              <>
                {p.images[0] ? (
                  <img
                    src={responsiveImage(p.images[0], 120)}
                    alt=""
                    loading="lazy"
                    width={120}
                    height={120}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                ) : (
                  <span className="grid h-14 w-14 place-items-center rounded-xl bg-paper-2 text-ink">·</span>
                )}

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {p.name}
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                        p.is_active ? 'bg-paper-2 text-ink-2' : 'bg-ink/10 text-ink-faint',
                      )}
                    >
                      {p.is_active ? 'Live' : 'Hidden'}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {formatPrice(p.price)}
                    {p.brands ? ` · ${p.brands.name}` : ''}
                    {p.categories ? ` · ${p.categories.name}` : ''}
                  </p>
                </div>

                <StockBadge status={p.stock_status} />

                <div className="flex items-center gap-1">
                  <Link
                    to={`/admin/products/${p.id}`}
                    className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink max-lg:h-11 max-lg:w-11"
                    aria-label={`Edit ${p.name}`}
                  >
                    <IconEdit className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirmId(p.id)}
                    className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-stock-no/10 hover:text-stock-no max-lg:h-11 max-lg:w-11"
                    aria-label={`Delete ${p.name}`}
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}