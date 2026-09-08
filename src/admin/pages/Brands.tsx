import { useEffect, useState } from 'react'
import {
  createBrandAdmin,
  deleteBrandAdmin,
  listBrandsAdmin,
  updateBrandAdmin,
} from '../../lib/adminApi'
import { useSeo } from '../../lib/seo'
import { slugify } from '../../lib/utils'
import type { Brand } from '../../lib/types'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import { Field, inputClass } from '../components/Fields'
import { IconEdit, IconPlus, IconTrash } from '../../components/ui/Icons'

interface Editable {
  name: string
  slug: string
  image_url: string
}

export default function Brands() {
  useSeo({ title: 'Brands', robots: 'noindex,follow' })
  const [brands, setBrands] = useState<Brand[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Editable>({ name: '', slug: '', image_url: '' })
  const [adding, setAdding] = useState(false)
  const [newBrand, setNewBrand] = useState<Editable>({ name: '', slug: '', image_url: '' })
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
    setDraft({ name: b.name, slug: b.slug, image_url: b.image_url ?? '' })
  }

  async function saveEdit(b: Brand) {
    setBusy(true)
    try {
      await updateBrandAdmin(b.id, {
        name: draft.name.trim() || b.name,
        slug: slugify(draft.slug || draft.name) || b.slug,
        image_url: draft.image_url.trim() || null,
      })
      setEditingId(null)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function create() {
    setBusy(true)
    try {
      await createBrandAdmin({
        name: newBrand.name.trim(),
        slug: slugify(newBrand.slug || newBrand.name),
        image_url: newBrand.image_url.trim() || null,
        sort_order: (brands?.length ?? 0) + 1,
      })
      setNewBrand({ name: '', slug: '', image_url: '' })
      setAdding(false)
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
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            <Button onClick={() => void create()} disabled={busy || !newBrand.name.trim()}>
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
                <div className="flex flex-1 flex-wrap items-end gap-3">
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
                  <Button size="sm" onClick={() => void saveEdit(b)} disabled={busy}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              ) : confirmingId === b.id ? (
                <div className="flex w-full items-center gap-2 text-sm font-semibold text-stock-no">
                  Delete this?
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    disabled={busy}
                    className="ml-auto rounded-lg px-2 py-1 font-medium text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(b.id)}
                    disabled={busy}
                    className="rounded-lg bg-stock-no px-2 py-1 font-medium text-paper transition-colors hover:brightness-95 disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {b.image_url ? (
                      <img src={b.image_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
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
                    className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-ink/5 hover:text-ink"
                    aria-label={`Edit ${b.name}`}
                  >
                    <IconEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(b.id)}
                    className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-stock-no/10 hover:text-stock-no"
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
