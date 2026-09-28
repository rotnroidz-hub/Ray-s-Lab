import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProducts } from '../hooks/useData'
import { useDebounce } from '../hooks/useDebounce'
import { useSeo } from '../lib/seo'
import { ProductGrid } from '../components/catalog/ProductGrid'
import { IconSearch } from '../components/ui/Icons'

export function Search() {
  const [params, setParams] = useSearchParams()
  const initial = params.get('q') ?? ''
  const [input, setInput] = useState(initial)
  const debounced = useDebounce(input, 350)
  const previous = useRef(debounced)
  // The last query we pushed to the URL ourselves, so the URL->input sync
  // below doesn't fight our own typing (which debounce-writes to the URL).
  const wroteToUrl = useRef<string | null>(null)

  // External navigation landed on /search?q=… while this page was already
  // mounted (e.g. the header search form). Adopt the URL's query.
  const urlQuery = params.get('q') ?? ''
  useEffect(() => {
    if (urlQuery !== input && wroteToUrl.current !== urlQuery) {
      setInput(urlQuery)
    }
  }, [urlQuery, input])

  // Keep the URL in sync as the user types (debounced-as-you-type).
  useEffect(() => {
    if (debounced === previous.current) return
    previous.current = debounced
    wroteToUrl.current = debounced.trim()
    const next = new URLSearchParams(params)
    if (debounced.trim()) next.set('q', debounced.trim())
    else next.delete('q')
    setParams(next, { replace: true })
  }, [debounced, params, setParams])

  const results = useProducts(undefined, debounced, 12)
  const failed = Boolean(results.error)

  const summary = useMemo(() => {
    if (!debounced.trim() || failed) return null
    return results.loading ? 'Searching…' : `${results.count} result${results.count === 1 ? '' : 's'} for “${debounced.trim()}”`
  }, [debounced, results.loading, results.count, failed])

  useSeo({
    title: debounced.trim() ? `Search: ${debounced.trim()}` : 'Search',
    description: 'Search the catalog by name, description, brand or tag.',
    canonicalPath: '/search',
    robots: 'noindex,follow',
  })

  return (
    <div className="container-site pb-20">
      <header className="py-10 sm:py-14">
        <p className="eyebrow">Search</p>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Find a product</h1>
      </header>

      {/* Sticky search input on mobile too. */}
      <div className="sticky top-16 z-30 -mx-4 mb-8 bg-paper/90 px-4 py-3 backdrop-blur sm:top-20">
        <div className="relative mx-auto max-w-2xl">
          <input
            type="search"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search name, description or tag…"
            aria-label="Search products"
            className="w-full rounded-full border border-ink/15 bg-paper-2 py-4 pl-12 pr-5 text-base text-ink placeholder:text-ink-faint focus:border-ink focus:bg-paper"
          />
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
        </div>
      </div>

      {summary && <p className="mb-6 text-sm text-ink-faint">{summary}</p>}

      <ProductGrid
        products={results.data}
        loading={results.loading}
        hasMore={results.hasMore}
        onLoadMore={results.loadMore}
      />

      {/* A failed query must never be presented as an empty result set. */}
      {!results.loading && results.error && (
        <div className="py-24 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-paper-2">
            <IconSearch className="h-7 w-7 text-ink/30" />
          </div>
          <p className="mt-4 font-display text-xl text-ink">Search is unavailable right now, please try again</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-faint">
            The search service did not respond, so no results could be loaded. Please try again in a moment.
          </p>
        </div>
      )}

      {!results.loading && !results.error && debounced.trim() && results.data.length === 0 && (
        <div className="py-24 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-paper-2">
            <IconSearch className="h-7 w-7 text-ink/30" />
          </div>
          <p className="mt-4 font-display text-xl text-ink">No results for “{debounced.trim()}”</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-faint">
            Try a different spelling, or browse the whole catalog instead.
          </p>
        </div>
      )}

      {!debounced.trim() && (
        <div className="py-24 text-center text-sm text-ink-faint">
          Type a keyword above to search the catalog.
        </div>
      )}
    </div>
  )
}