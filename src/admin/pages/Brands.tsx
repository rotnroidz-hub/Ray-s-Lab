import { useEffect, useState } from 'react'
import {
  createBrandAdmin,
  deleteBrandAdmin,
  listBrandsAdmin,
  updateBrandAdmin,
} from '../../lib/adminApi'
import { useSeo } from '../../lib/seo'
import { cn, slugify } from '../../lib/utils'
import type { Brand } from '../../lib/types'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import { Field, inputClass } from '../components/Fields'
import { IconEdit, IconPlus, IconTrash } from '../../components/ui/Icons'

/** Mirrors the DB CHECK (brands_color_*_hex_check): #RRGGBB only. */
const HEX_RE = /^#[0-9A-Fa-f]{6}$/

interface Editable {
  name: string
  slug: string
  image_url: string
  /** '' means unset (saved as null); otherwise a #RRGGBB string. */
  color_primary: string
  color_secondary: string
}

const emptyEditable: Editable = { name: '', slug: '', image_url: '', color_primary: '', color_secondary: '' }

/** Both colours or neither; invalid hex rejected with a message. */
function colourPairError(primary: string, secondary: string): string | null {
  const p = primary.trim()
  const s = secondary.trim()
  if (!p && !s) return null
  if (p && !HEX_RE.test(p)) return 'Primary colour must be a hex value like #RRGGBB.'
  if (s && !HEX_RE.test(s)) return 'Secondary colour must be a hex value like #RRGGBB.'
  if (Boolean(p) !== Boolean(s)) return 'Set both colours, or clear both to use the default cream pill.'
  return null
}

function ColourField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (next: string) => void
}) {
  const invalid = value.trim() !== '' && !HEX_RE.test(value.trim())
  return (
    <Field label={label} className="flex-1 basis-44">
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={HEX_RE.test(value.trim()) ? value.trim() : '#E3DCCB'}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-11 shrink-0 cursor-pointer rounded-2xl border border-ink/15 bg-paper p-1"
        />
        <input
          className={cn(inputClass, invalid && 'border-stock-no')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#RRGGBB"
          spellCheck={false}
        />
      </div>
      {invalid && <span className="mt-1.5 block text-xs text-stock-no">Use #RRGGBB, e.g. #0090E6.</span>}
    </Field>
  )
}

function ChipPreview({ label, primary, secondary }: { label: string; primary: string; secondary: string }) {
  const p = primary.trim()
  const s = secondary.trim()
  const gradient = HEX_RE.test(p) && HEX_RE.test(s)
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink">Preview</span>
      <span
        className={cn(
          'inline-flex min-h-[44px] max-w-[220px] items-center truncate rounded-full border px-4 text-[13.5px] font-medium',
          gradient ? 'border-ink/10 text-paper-2' : 'border-line bg-card text-ink',
        )}
        style={gradient ? { backgroundImage: `linear-gradient(135deg, ${p}, ${s})` } : undefined}
      >
        {label.trim() || 'Brand name'}
      </span>
    </div>
  )
}

export default function Brands() {
  useSeo({ title: 'Brands', robots: 'noindex,follow' })
  const [brands, setBrands] = useState<Brand[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Editable>(emptyEditable)
  const [adding, setAdding] = useState(false)
  const [newBrand, setNewBrand] = useState<Editable>(emptyEditable)
  const [busy, setBusy] = useState(false)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  async function load() {
    try {
      setBrands(await listBrandsAdmin())
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function startEdit(b: Brand) {
    setEditingId(b.id)
    setDraft({
      name: b.name,
      slug: b.slug,
      image_url: b.image_url ?? '',
      color_primary: b.color_primary ?? '',
      color_secondary: b.color_secondary ?? '',
    })
  }

  function clearColours(which: 'draft' | 'new') {
    const reset = (p: Editable): Editable => ({ ...p, color_primary: '', color_secondary: '' })
    if (which === 'draft') setDraft(reset)
    else setNewBrand(reset)
  }

  async function saveEdit(b: Brand) {
    const colours = colourPairError(draft.color_primary, draft.color_secondary)
    if (colours) {
      setError(colours)
      return
    }
    setBusy(true)
    try {
      await updateBrandAdmin(b.id, {
        name: draft.name.trim() || b.name,
        slug: slugify(draft.slug || draft.name) || b.slug,
        image_url: draft.image_url.trim() || null,
        color_primary: draft.color_primary.trim() || null,
        color_secondary: draft.color_secondary.trim() || null,
      })
      setEditingId(null)
      setError(null)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function create() {
    const colours = colourPairError(newBrand.color_primary, newBrand.color_secondary)
    if (colours) {
      setError(colours)
      return
    }
    setBusy(true)
    try {
      await createBrandAdmin({
        name: newBrand.name.trim(),
        slug: slugify(newBrand.slug || newBrand.name),
        image_url: newBrand.image_url.trim() || null,
        color_primary: newBrand.color_primary.trim() || null,
        color_secondary: newBrand.color_secondary.trim() || null,
        sort_order: (brands?.length ?? 0) + 1,
      })
      setNewBrand(emptyEditable)
      setAdding(false)
      setError(null)
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
      await deleteBrandAdmin(id)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
      setConfirmingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Filtering</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Brands</h1>
          <p className="mt-1 text-sm text-ink-faint">
            Assign products a brand to enable the catalog filter and /brand pages.
          </p>
        </div>
        <Button variant="outline" onClick={() => setAdding((v) => !v)} disabled={busy}>
          <IconPlus className="h-4 w-4" /> Add brand
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-2xl bg-stock-no/10 px-4 py-3 text-sm text-stock-no">
          {error}
        </p>
      )}

      {adding && (
        <div className="mt-6 rounded-3xl border border-ink/30 bg-paper-2 p-5">
          <h2 className="font-display text-lg font-semibold text-ink">New brand</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Name" required>
              <input
                className={inputClass}
                value={newBrand.name}
                onChange={(e) =>
                  setNewBrand((prev) => ({ ...prev, name: e.target.value, slug: prev.slug ? prev.slug : slugify(e.target.value) }))
                }
                placeholder="JBL"
              />
            </Field>
            <Field label="Slug">
              <input
                className={inputClass}
                value={newBrand.slug}
                onChange={(e) => setNewBrand((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="jbl"
              />
            </Field>
            <Field label="Image URL" className="sm:col-span-2">
              <input
                className={inputClass}
                value={newBrand.image_url}
                onChange={(e) => setNewBrand((prev) => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://…/brand-cover.jpg"
              />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <ColourField
              label="Primary colour"
              value={newBrand.color_primary}
              onChange={(v) => setNewBrand((prev) => ({ ...prev, color_primary: v }))}
            />
            <ColourField
              label="Secondary colour"
              value={newBrand.color_secondary}
              onChange={(v) => setNewBrand((prev) => ({ ...prev, color_secondary: v }))}
            />
            <ChipPreview label={newBrand.name} primary={newBrand.color_primary} secondary={newBrand.color_secondary} />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => clearColours('new')}
              disabled={busy || (!newBrand.color_primary && !newBrand.color_secondary)}
            >
              Clear colours
            </Button>
          </div>
          {(() => {
            const msg = colourPairError(newBrand.color_primary, newBrand.color_secondary)
            return msg ? (
              <p role="alert" className="mt-2 text-xs text-stock-no">{msg}</p>
            ) : null
          })()}
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            <Button
              onClick={() => void create()}
              disabled={busy || !newBrand.name.trim() || Boolean(colourPairError(newBrand.color_primary, newBrand.color_secondary))}
            >
              Create
            </Button>
          </div>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {brands === null && (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        )}

        {brands?.length === 0 && (
          <p className="rounded-2xl border border-ink/10 p-10 text-center text-sm text-ink-faint">
            No brands yet — add your first one.
          </p>
        )}

        {brands?.map((b) => {
          const isEditing = editingId === b.id
          return (
            <li
              key={b.id}
              className={`flex items-center gap-3 rounded-2xl border p-3 ${
                confirmingId === b.id ? 'border-stock-no/30 bg-stock-no-soft' : 'border-ink/10 bg-paper-2'
              }`}
            >
              {isEditing ? (
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <Field label="Name" className="flex-1 basis-40">
                      <input
                        className={inputClass}
                        value={draft.name}
                        onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                      />
                    </Field>
                    <Field label="Slug" className="flex-1 basis-40">
                      <input
                        className={inputClass}
                        value={draft.slug}
                        onChange={(e) => setDraft((p) => ({ ...p, slug: e.target.value }))}
                      />
                    </Field>
                    <Button
                      size="sm"
                      onClick={() => void saveEdit(b)}
                      disabled={busy || Boolean(colourPairError(draft.color_primary, draft.color_secondary))}
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    <ColourField
                      label="Primary colour"
                      value={draft.color_primary}
                      onChange={(v) => setDraft((p) => ({ ...p, color_primary: v }))}
                    />
                    <ColourField
                      label="Secondary colour"
                      value={draft.color_secondary}
                      onChange={(v) => setDraft((p) => ({ ...p, color_secondary: v }))}
                    />
                    <ChipPreview
                      label={draft.name || b.name}
                      primary={draft.color_primary}
                      secondary={draft.color_secondary}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => clearColours('draft')}
                      disabled={busy || (!draft.color_primary && !draft.color_secondary)}
                    >
                      Clear colours
                    </Button>
                  </div>
                  {(() => {
                    const msg = colourPairError(draft.color_primary, draft.color_secondary)
                    return msg ? (
                      <p role="alert" className="text-xs text-stock-no">{msg}</p>
                    ) : null
                  })()}
                </div>
              ) : confirmingId === b.id ? (
                <div className="flex w-full items-center gap-2 text-sm font-semibold text-stock-no">
                  Delete this?
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    disabled={busy}
                    className="ml-auto rounded-lg px-2 py-1 font-medium text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-40 max-lg:min-h-[44px]"
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
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {b.image_url ? (
                      <img src={b.image_url} alt="" loading="lazy" width={96} height={96} className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-paper-2 text-ink">
                        {b.name.trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{b.name}</p>
                      <p className="truncate text-xs text-ink-faint">/brand/{b.slug}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(b)}
                    className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-ink/5 hover:text-ink max-lg:h-11 max-lg:w-11"
                    aria-label={`Edit ${b.name}`}
                  >
                    <IconEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(b.id)}
                    className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-stock-no/10 hover:text-stock-no max-lg:h-11 max-lg:w-11"
                    aria-label={`Delete ${b.name}`}
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
