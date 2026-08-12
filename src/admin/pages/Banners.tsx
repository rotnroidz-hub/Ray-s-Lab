import { useEffect, useState } from 'react'
import { deleteBannerAdmin, listBannersAdmin, upsertBannerAdmin } from '../../lib/adminApi'
import { useSeo } from '../../lib/seo'
import { responsiveImage } from '../../lib/image'
import type { Banner } from '../../lib/types'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import { Field, Toggle, inputClass } from '../components/Fields'
import { IconChevronDown, IconChevronUp, IconEdit, IconPlus, IconTrash } from '../../components/ui/Icons'

interface Draft {
  id?: string
  image_url: string
  title: string
  subtitle: string
  link_url: string
  is_active: boolean
}

const emptyDraft: Draft = { image_url: '', title: '', subtitle: '', link_url: '', is_active: true }

export default function Banners() {
  useSeo({ title: 'Banners', robots: 'noindex,follow' })
  const [banners, setBanners] = useState<Banner[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      setBanners(await listBannersAdmin())
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function persistOrder(next: Banner[]) {
    setBanners(next)
    try {
      for (const [sort_order, b] of next.entries()) {
        await upsertBannerAdmin({
          id: b.id,
          sort_order,
          is_active: b.is_active,
          image_url: b.image_url,
          title: b.title,
          subtitle: b.subtitle,
          link_url: b.link_url,
        })
      }
    } catch (e) {
      setError((e as Error).message)
      void load()
    }
  }

  function move(index: number, delta: -1 | 1) {
    if (!banners) return
    const target = index + delta
    if (target < 0 || target >= banners.length) return
    const next = [...banners]
    ;[next[index], next[target]] = [next[target], next[index]]
    void persistOrder(next)
  }

  async function save() {
    if (!draft) return
    setBusy(true)
    try {
      await upsertBannerAdmin({
        ...draft,
        sort_order: draft.id
          ? (banners?.find((b) => b.id === draft.id)?.sort_order ?? 1)
          : (banners?.length ?? 0) + 1,
      })
      setDraft(null)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this banner?')) return
    setBusy(true)
    try {
      await deleteBannerAdmin(id)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const editing = draft !== null

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Home page</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Banners</h1>
          <p className="mt-1 text-sm text-ink-muted">
            The hero carousel on the storefront home page. First item shows first.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setDraft(editing ? null : { ...emptyDraft })}
          disabled={busy}
        >
          <IconPlus className="h-4 w-4" /> Add banner
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-2xl bg-clay/10 px-4 py-3 text-sm text-clay">
          {error}
        </p>
      )}

      {editing && (
        <div className="mt-6 space-y-4 rounded-3xl border border-pine/30 bg-canvas-deep p-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            {draft.id ? 'Edit banner' : 'New banner'}
          </h2>
          <BannerFormFields draft={draft} onChange={setDraft} />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
            <Button onClick={() => void save()} disabled={busy || !draft.image_url.trim()}>
              {draft.id ? 'Save changes' : 'Create banner'}
            </Button>
          </div>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {banners === null && (
          <>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </>
        )}

        {banners?.map((b, i) => (
          <li key={b.id} className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-canvas-deep p-3">
            <div className="flex flex-col pt-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0 || busy}
                aria-label="Move up"
                className="grid h-6 w-8 place-items-center rounded text-ink-muted hover:bg-ink/5 hover:text-ink disabled:opacity-30"
              >
                <IconChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === (banners?.length ?? 0) - 1 || busy}
                aria-label="Move down"
                className="grid h-6 w-8 place-items-center rounded text-ink-muted hover:bg-ink/5 hover:text-ink disabled:opacity-30"
              >
                <IconChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              {b.image_url ? (
                <img
                  src={responsiveImage(b.image_url, 600)}
                  alt=""
                  className="aspect-[21/9] w-full rounded-xl object-cover"
                />
              ) : (
                <span className="grid aspect-[21/9] w-full place-items-center rounded-xl bg-pine-soft text-sm text-pine">
                  No image
                </span>
              )}
              <div className="mt-3 flex items-center gap-3">
                <p className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {b.title || 'Untitled'}
                  </span>
                  <span className="block truncate text-xs text-ink-muted">
                    {b.subtitle || 'No subtitle'} · {b.is_active ? 'Live' : 'Hidden'}
                  </span>
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setDraft({
                      id: b.id,
                      image_url: b.image_url,
                      title: b.title,
                      subtitle: b.subtitle,
                      link_url: b.link_url,
                      is_active: b.is_active,
                    })
                  }
                >
                  <IconEdit className="h-4 w-4" /> Edit
                </Button>
                <button
                  type="button"
                  onClick={() => void remove(b.id)}
                  disabled={busy}
                  className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-clay/10 hover:text-clay disabled:opacity-40"
                  aria-label={`Delete banner ${b.title}`}
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {banners?.length === 0 && (
        <p className="rounded-2xl border border-ink/10 p-10 text-center text-sm text-ink-muted">
          No banners yet. The home page falls back to a simple default hero.
        </p>
      )}
    </div>
  )
}

function BannerFormFields({
  draft,
  onChange,
}: {
  draft: Draft
  onChange: (next: Draft) => void
}) {
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => onChange({ ...draft, [key]: value })
  return (
    <div className="grid gap-4">
      <Field label="Image URL" required hint="Landscape image, ideally 16:9 or wider.">
        <input
          className={inputClass}
          value={draft.image_url}
          onChange={(e) => set('image_url', e.target.value)}
          placeholder="https://…/banner.jpg"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title">
          <input
            className={inputClass}
            value={draft.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="New season, new gear"
          />
        </Field>
        <Field label="Subtitle">
          <input
            className={inputClass}
            value={draft.subtitle}
            onChange={(e) => set('subtitle', e.target.value)}
            placeholder="A short supporting line"
          />
        </Field>
      </div>
      <Field label="Link URL" hint="Where the button goes — e.g. /catalog or /category/audio">
        <input
          className={inputClass}
          value={draft.link_url}
          onChange={(e) => set('link_url', e.target.value)}
          placeholder="/catalog"
        />
      </Field>
      <Toggle
        label="Active"
        checked={draft.is_active}
        onChange={(next) => set('is_active', next)}
        activeLabel="Shown in the hero carousel"
        inactiveLabel="Hidden from the storefront"
      />
    </div>
  )
}