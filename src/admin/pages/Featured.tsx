import { useEffect, useMemo, useRef, useState } from 'react'
import {
  listFeaturedProductsAdmin,
  listNonFeaturedProductsAdmin,
  reorderFeatured,
  setProductFeatured,
} from '../../lib/adminApi'
import { useSeo } from '../../lib/seo'
import { formatPrice, cn } from '../../lib/utils'
import { responsiveImage } from '../../lib/image'
import type { Product } from '../../lib/types'
import { Skeleton } from '../../components/ui/Skeleton'
import { IconChevronDown, IconChevronUp } from '../../components/ui/Icons'

export default function Featured() {
  useSeo({ title: 'Handpicked', robots: 'noindex,follow' })
  const [featured, setFeatured] = useState<Product[] | null>(null)
  const [available, setAvailable] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  async function load() {
    try {
      const [feat, non] = await Promise.all([
        listFeaturedProductsAdmin(),
        listNonFeaturedProductsAdmin(),
      ])
      setFeatured(feat)
      setAvailable(non)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return available
    return available.filter(
      (p) => p.name.toLowerCase().includes(q) || p.brands?.name.toLowerCase().includes(q),
    )
  }, [available, query])

  async function persistOrder(next: Product[]) {
    const ordered = next.map((p, i) => ({ id: p.id, featured_order: i + 1 }))
    setFeatured(next)
    try {
      await reorderFeatured(ordered)
      await load()
    } catch (e) {
      setError((e as Error).message)
      await load()
    }
  }

  function move(index: number, delta: -1 | 1) {
    if (!featured) return
    const target = index + delta
    if (target < 0 || target >= featured.length) return
    const next = [...featured]
    ;[next[index], next[target]] = [next[target], next[index]]
    void persistOrder(next)
  }

  async function add(p: Product) {
    setBusy(true)
    try {
      await setProductFeatured(p.id, true, (featured?.length ?? 0) + 1)
      setQuery('')
      setOpen(false)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    setBusy(true)
    try {
      await setProductFeatured(id, false, 0)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <p className="eyebrow">Home page</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Handpicked</h1>
        <p className="mt-1 text-sm text-ink-faint">
          The two featured pieces shown under "Handpicked" on the home page.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-2xl bg-stock-no/10 px-4 py-3 text-sm text-stock-no">
          {error}
        </p>
      )}

      <div ref={boxRef} className="relative mt-6">
        <label htmlFor="featured-search" className="mb-1.5 block text-sm font-semibold text-ink">
          Add product
        </label>
        <input
          id="featured-search"
          className="w-full rounded-2xl border border-ink/15 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:bg-paper"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search products to feature…"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="featured-suggestions"
        />
        {open && (
          <ul
            id="featured-suggestions"
            role="listbox"
            className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-ink/15 bg-paper-2 shadow-lift"
          >
            {suggestions.length === 0 && (
              <li className="px-4 py-3 text-sm text-ink-faint">No matching products.</li>
            )}
            {suggestions.map((p) => (
              <li key={p.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => void add(p)}
                  disabled={busy}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-ink/5 disabled:opacity-40"
                >
                  {p.images[0] ? (
                    <img src={responsiveImage(p.images[0], 80)} alt="" className="h-9 w-9 rounded-lg object-cover" />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-paper text-ink">·</span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{p.name}</span>
                    <span className="block text-xs text-ink-faint">{formatPrice(p.price)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ul className="mt-6 space-y-3">
        {featured === null && (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        )}

        {featured?.length === 0 && (
          <p className="rounded-2xl border border-ink/10 p-10 text-center text-sm text-ink-faint">
            Nothing handpicked yet. The Handpicked section is hidden on the home page.
          </p>
        )}

        {featured?.map((p, i) => (
          <li
            key={p.id}
            className={cn(
              'flex items-center gap-3 rounded-2xl border border-ink/10 bg-paper-2 p-3',
              i >= 2 && 'opacity-50',
            )}
          >
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0 || busy}
                aria-label="Move up"
                className="grid h-6 w-8 place-items-center rounded text-ink-faint hover:bg-ink/5 hover:text-ink disabled:opacity-30"
              >
                <IconChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === (featured?.length ?? 0) - 1 || busy}
                aria-label="Move down"
                className="grid h-6 w-8 place-items-center rounded text-ink-faint hover:bg-ink/5 hover:text-ink disabled:opacity-30"
              >
                <IconChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-3">
              {p.images[0] ? (
                <img src={responsiveImage(p.images[0], 120)} alt="" className="h-14 w-14 rounded-xl object-cover" />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded-xl bg-paper text-ink">·</span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                <p className="truncate text-xs text-ink-faint">{formatPrice(p.price)}</p>
                {i >= 2 && (
                  <p className="mt-0.5 text-xs text-ink-soft">
                    Not shown, only the top two appear on the home page.
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void remove(p.id)}
              disabled={busy}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-stock-no transition-colors hover:bg-stock-no/10 disabled:opacity-40"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}