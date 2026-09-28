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
  eyebrow: string
  cta_label: string
  cta2_label: string
  cta2_url: string
}

const emptyDraft: Draft = {
  image_url: '',
  title: '',
  subtitle: '',
  link_url: '',
  is_active: true,
  eyebrow: '',
  cta_label: '',
  cta2_label: '',
  cta2_url: '',
}

export default function Banners() {
  useSeo({ title: 'Banners', robots: 'noindex,follow' })
  const [banners, setBanners] = useState<Banner[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

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
          eyebrow: b.eyebrow ?? '',
          cta_label: b.cta_label ?? '',
          cta2_label: b.cta2_label ?? '',
          cta2_url: b.cta2_url ?? '',
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
    setBusy(true)
    try {
      await deleteBannerAdmin(id)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
      setConfirmingId(null)
    }
  }

  const editing = draft !== null

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Home page</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Banners</h1>
          <p className="mt-1 text-sm text-ink-faint">
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
        <p role="alert" className="mt-6 rounded-2xl bg-stock-no/10 px-4 py-3 text-sm text-stock-no">
          {error}
        </p>
      )}

      {editing && (
        <div className="mt-6 space-y-4 rounded-3xl border border-ink/30 bg-paper-2 p-5">
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
          <li
            key={b.id}
            className={`flex items-start gap-3 rounded-2xl border p-3 ${
              confirmingId === b.id ? 'border-stock-no/30 bg-stock-no-soft' : 'border-ink/10 bg-paper-2'
            }`}
          >
            <div className="flex flex-col pt-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0 || busy}
                aria-label="Move up"
                className="grid h-6 w-8 place-items-center rounded text-ink-faint hover:bg-ink/5 hover:text-ink disabled:opacity-30 max-lg:h-11 max-lg:w-11"
              >
                <IconChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === (banners?.length ?? 0) - 1 || busy}
                aria-label="Move down"
                className="grid h-6 w-8 place-items-center rounded text-ink-faint hover:bg-ink/5 hover:text-ink disabled:opacity-30 max-lg:h-11 max-lg:w-11"
              >
                <IconChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              {b.image_url ? (
                <img
                  src={responsiveImage(b.image_url, 600)}
                  alt=""
                  loading="lazy"
                  width={630}
                  height={270}
                  className="aspect-[21/9] w-full rounded-xl object-cover"
                />
              ) : (
                <span className="grid aspect-[21/9] w-full place-items-center rounded-xl bg-paper-2 text-sm text-ink">
                  No image
                </span>
              )}
              <div className="mt-3 flex items-center gap-3">
                <p className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {b.title || 'Untitled'}
                  </span>
                  <span className="block truncate text-xs text-ink-faint">
                    {b.subtitle || 'No subtitle'} · {b.is_active ? 'Live' : 'Hidden'}
                  </span>
                </p>
                {confirmingId === b.id ? (
                  <div className="flex items-center gap-2 text-sm font-semibold text-stock-no">
                    Delete this?
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      disabled={busy}
                      className="rounded-lg px-2 py-1 font-medium text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-40 max-lg:min-h-[44px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(b.id)}
                      disabled={busy}
                      className="rounded-lg bg-stock-no px-2 py-1 font-medium text-paper transition-colors hover:brightness-95 disabled:opacity-40 max-lg:min-h-[44px]"
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <>
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
                          eyebrow: b.eyebrow ?? '',
                          cta_label: b.cta_label ?? '',
                          cta2_label: b.cta2_label ?? '',
                          cta2_url: b.cta2_url ?? '',
                        })
                      }
                    >
                      <IconEdit className="h-4 w-4" /> Edit
                    </Button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(b.id)}
                      disabled={busy}
                      className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-stock-no/10 hover:text-stock-no disabled:opacity-40 max-lg:h-11 max-lg:w-11"
                      aria-label={`Delete banner ${b.title}`}
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {banners?.length === 0 && (
        <p className="rounded-2xl border border-ink/10 p-10 text-center text-sm text-ink-faint">
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
      <Field label="Eyebrow">
        <input
          className={inputClass}
          value={draft.eyebrow}
          onChange={(e) => set('eyebrow', e.target.value)}
          placeholder="New season"
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Button label" hint="Leave the label blank to hide that button.">
          <input
            className={inputClass}
            value={draft.cta_label}
            onChange={(e) => set('cta_label', e.target.value)}
            placeholder="Shop now"
          />
        </Field>
        <Field label="Link URL" hint="Where the button goes — e.g. /catalog or /category/audio">
          <input
            className={inputClass}
            value={draft.link_url}
            onChange={(e) => set('link_url', e.target.value)}
            placeholder="/catalog"
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Second button label" hint="Leave the label blank to hide that button.">
          <input
            className={inputClass}
            value={draft.cta2_label}
            onChange={(e) => set('cta2_label', e.target.value)}
            placeholder="Learn more"
          />
        </Field>
        <Field label="Second button URL">
          <input
            className={inputClass}
            value={draft.cta2_url}
            onChange={(e) => set('cta2_url', e.target.value)}
            placeholder="/catalog"
          />
        </Field>
      </div>
      <Toggle
        label="Active"
        checked={draft.is_active}
        onChange={(next) => set('is_active', next)}
        activeLabel="Shown in the hero carousel"
        inactiveLabel="Hidden from the storefront"
      />

      {/* 21:9 preview, mirrors the storefront hero slide */}
      <div className="overflow-hidden rounded-2xl bg-ink">
        <div className="relative flex aspect-[21/9] flex-col justify-center gap-1 px-6 text-paper-2">
          {draft.eyebrow.trim() && (
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-blue-lite">
              {draft.eyebrow}
            </p>
          )}
          <p className="font-display text-lg font-semibold leading-tight">
            {draft.title.trim() || 'Banner title'}
          </p>
          {draft.subtitle.trim() && (
            <p className="text-xs text-paper-2/[0.66]">{draft.subtitle}</p>
          )}
          <div className="mt-1 flex flex-wrap gap-2">
            {draft.cta_label.trim() && (
              <span className="rounded-full bg-blue px-3 py-1 text-[11px] font-medium text-white">
                {draft.cta_label}
              </span>
            )}
            {draft.cta2_label.trim() && (
              <span className="rounded-full border border-paper-2/30 px-3 py-1 text-[11px] font-medium text-paper-2">
                {draft.cta2_label}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}