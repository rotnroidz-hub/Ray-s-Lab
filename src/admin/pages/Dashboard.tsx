import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  countCheckoutsThisWeek,
  listBrandsAdmin,
  listCategoriesAdmin,
  listProductsAdmin,
  publishChangesAdmin,
} from '../../lib/adminApi'
import { useSeo } from '../../lib/seo'
import { IconArrowRight, IconTag } from '../../components/ui/Icons'
import { Button } from '../../components/ui/Button'

function statCards(
  productCount: number | null,
  categoryCount: number | null,
  brandCount: number | null,
  checkoutCount: number | null,
) {
  return [
    { label: 'Products', value: productCount ?? '—', to: '/admin/products' },
    { label: 'Categories', value: categoryCount ?? '—', to: '/admin/categories' },
    { label: 'Brands', value: brandCount ?? '—', to: '/admin/brands' },
    { label: 'Checkouts this week', value: checkoutCount ?? '-', to: null },
  ]
}

export default function Dashboard() {
  useSeo({ title: 'Dashboard', robots: 'noindex,follow' })
  const [products, setProducts] = useState<number | null>(null)
  const [categories, setCategories] = useState<number | null>(null)
  const [brands, setBrands] = useState<number | null>(null)
  const [checkouts, setCheckouts] = useState<number | null>(null)
  const [publishState, setPublishState] = useState<'idle' | 'publishing' | 'success' | 'error'>('idle')
  const [publishMessage, setPublishMessage] = useState('')
  const [cooldown, setCooldown] = useState(false)
  const cooldownTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (cooldownTimer.current !== null) window.clearTimeout(cooldownTimer.current)
    }
  }, [])

  async function handlePublish() {
    if (publishState === 'publishing' || cooldown) return
    setPublishState('publishing')
    setPublishMessage('')
    try {
      await publishChangesAdmin()
      setPublishState('success')
      setPublishMessage('Publish triggered — the new build takes 1–2 minutes to go live.')
      // Rate-limit: don't let a double-click queue two builds.
      setCooldown(true)
      cooldownTimer.current = window.setTimeout(() => setCooldown(false), 60_000)
    } catch (err) {
      setPublishState('error')
      setPublishMessage(err instanceof Error ? err.message : 'Publish failed. Try again.')
    }
  }

  useEffect(() => {
    listProductsAdmin().then((p) => setProducts(p.length)).catch(() => setProducts(null))
    listCategoriesAdmin().then((c) => setCategories(c.length)).catch(() => setCategories(null))
    listBrandsAdmin().then((b) => setBrands(b.length)).catch(() => setBrands(null))
    countCheckoutsThisWeek().then(setCheckouts).catch(() => setCheckouts(null))
  }, [])

  return (
    <div>
      <p className="eyebrow">Overview</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Welcome back</h1>
      <p className="mt-2 text-sm text-ink-faint">
        Manage your catalog from here. Product changes appear on the storefront immediately —
        the sitemap and link previews only refresh after a Publish.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards(products, categories, brands, checkouts).map((s) =>
          s.to ? (
            <Link
              key={s.label}
              to={s.to}
              className="group rounded-3xl border border-ink/10 bg-paper-2 p-6 transition-all hover:border-ink/40 hover:shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-paper">
                  <IconTag className="h-5 w-5" />
                </span>
                <IconArrowRight className="h-5 w-5 text-ink/25 transition-transform group-hover:translate-x-1 group-hover:text-ink" />
              </div>
              <p className="mt-5 font-display text-4xl font-semibold text-ink">{s.value}</p>
              <p className="mt-1 text-sm font-medium text-ink-soft">{s.label}</p>
            </Link>
          ) : (
            <div
              key={s.label}
              className="rounded-3xl border border-ink/10 bg-paper-2 p-6"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-paper">
                  <IconTag className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-5 font-display text-4xl font-semibold text-ink">{s.value}</p>
              <p className="mt-1 text-sm font-medium text-ink-soft">{s.label}</p>
            </div>
          ),
        )}

        <Link
          to="/admin/products/new"
          className="group flex flex-col justify-between rounded-3xl border border-dashed border-ink/40 bg-paper-2/50 p-6 transition-all hover:border-ink"
        >
          <span className="font-display text-2xl font-semibold text-ink">Add a product</span>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink">
            New product form <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>

      <div className="mt-4 rounded-3xl border border-ink/10 bg-paper-2 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-xl font-semibold text-ink">Publish changes</p>
            <p className="mt-1 text-sm text-ink-faint">
              Publishes catalog changes to the live site — sitemap and link previews. Takes 1–2 minutes.
            </p>
          </div>
          <Button
            type="button"
            variant="dark"
            onClick={() => void handlePublish()}
            disabled={publishState === 'publishing' || cooldown}
          >
            {publishState === 'publishing'
              ? 'Publishing…'
              : cooldown
                ? 'Published'
                : 'Publish changes'}
          </Button>
        </div>
        {publishMessage ? (
          <p
            role={publishState === 'error' ? 'alert' : 'status'}
            className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
              publishState === 'error' ? 'bg-stock-no/10 text-stock-no' : 'bg-stock-ok-soft text-stock-ok'
            }`}
          >
            {publishMessage}
          </p>
        ) : null}
      </div>
    </div>
  )
}