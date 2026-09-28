import { useEffect, useState } from 'react'
import {
  createCategoryAdmin,
  deleteCategoryAdmin,
  listCategoriesAdmin,
  updateCategoryAdmin,
} from '../../lib/adminApi'
import { useSeo } from '../../lib/seo'
import { slugify } from '../../lib/utils'
import type { Category } from '../../lib/types'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import { Field, inputClass } from '../components/Fields'
import { IconChevronDown, IconChevronUp, IconEdit, IconPlus, IconTrash } from '../../components/ui/Icons'

interface Editable {
  name: string
  slug: string
  image_url: string
}

export default function Categories() {
  useSeo({ title: 'Categories', robots: 'noindex,follow' })
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Editable>({ name: '', slug: '', image_url: '' })
  const [adding, setAdding] = useState(false)
  const [newCat, setNewCat] = useState<Editable>({ name: '', slug: '', image_url: '' })
  const [busy, setBusy] = useState(false)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  async function load() {
    try {
      setCategories(await listCategoriesAdmin())
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function persistOrder(next: Category[]) {
    setCategories(next)
    const { reorderCategoriesAdmin } = await import('../../lib/adminApi')
    try {
      await reorderCategoriesAdmin(next.map((c) => c.id))
    } catch (e) {
      setError((e as Error).message)
      void load()
    }
  }

  function move(index: number, delta: -1 | 1) {
    if (!categories) return
    const target = index + delta
    if (target < 0 || target >= categories.length) return
    const next = [...categories]
    ;[next[index], next[target]] = [next[target], next[index]]
    void persistOrder(next)
  }

  function startEdit(c: Category) {
    setEditingId(c.id)
    setDraft({ name: c.name, slug: c.slug, image_url: c.image_url ?? '' })
  }

  async function saveEdit(c: Category) {
    setBusy(true)
    try {
      await updateCategoryAdmin(c.id, {
        name: draft.name.trim() || c.name,
        slug: slugify(draft.slug || draft.name) || c.slug,
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
      await createCategoryAdmin({
        name: newCat.name.trim(),
        slug: slugify(newCat.slug || newCat.name),
        image_url: newCat.image_url.trim() || null,
        sort_order: (categories?.length ?? 0) + 1,
      })
      setNewCat({ name: '', slug: '', image_url: '' })
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
      await deleteCategoryAdmin(id)
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
          <p className="eyebrow">Navigation</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Categories</h1>
          <p className="mt-1 text-sm text-ink-faint">
            Order here controls the nav menu and home page.
          </p>
        </div>
        <Button variant="outline" onClick={() => setAdding((v) => !v)} disabled={busy}>
          <IconPlus className="h-4 w-4" /> Add category
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-2xl bg-stock-no/10 px-4 py-3 text-sm text-stock-no">
          {error}
        </p>
      )}

      {adding && (
        <div className="mt-6 rounded-3xl border border-ink/30 bg-paper-2 p-5">
          <h2 className="font-display text-lg font-semibold text-ink">New category</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Name" required>
              <input
                className={inputClass}
                value={newCat.name}
                onChange={(e) =>
                  setNewCat((prev) => ({ ...prev, name: e.target.value, slug: prev.slug ? prev.slug : slugify(e.target.value) }))
                }
                placeholder="Audio"
              />
            </Field>
            <Field label="Slug">
              <input
                className={inputClass}
                value={newCat.slug}
                onChange={(e) => setNewCat((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="audio"
              />
            </Field>
            <Field label="Image URL" className="sm:col-span-2">
              <input
                className={inputClass}
                value={newCat.image_url}
                onChange={(e) => setNewCat((prev) => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://…/category-cover.jpg"
              />
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            <Button onClick={() => void create()} disabled={busy || !newCat.name.trim()}>
              Create
            </Button>
          </div>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {categories === null && (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        )}

        {categories?.map((c, i) => {
          const isEditing = editingId === c.id
          return (
            <li
              key={c.id}
              className={`flex items-center gap-3 rounded-2xl border p-3 ${
                confirmingId === c.id ? 'border-stock-no/30 bg-stock-no-soft' : 'border-ink/10 bg-paper-2'
              }`}
            >
              <div className="flex flex-col">
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
                  disabled={i === (categories?.length ?? 0) - 1 || busy}
                  aria-label="Move down"
                  className="grid h-6 w-8 place-items-center rounded text-ink-faint hover:bg-ink/5 hover:text-ink disabled:opacity-30 max-lg:h-11 max-lg:w-11"
                >
                  <IconChevronDown className="h-4 w-4" />
                </button>
              </div>

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
                  <Button size="sm" onClick={() => void saveEdit(c)} disabled={busy}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              ) : confirmingId === c.id ? (
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
                    onClick={() => void remove(c.id)}
                    disabled={busy}
                    className="rounded-lg bg-stock-no px-2 py-1 font-medium text-paper transition-colors hover:brightness-95 disabled:opacity-40 max-lg:min-h-[44px]"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {c.image_url ? (
                      <img src={c.image_url} alt="" loading="lazy" width={96} height={96} className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-paper-2 text-ink">·</span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{c.name}</p>
                      <p className="truncate text-xs text-ink-faint">/category/{c.slug}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(c)}
                    className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-ink/5 hover:text-ink max-lg:h-11 max-lg:w-11"
                    aria-label={`Edit ${c.name}`}
                  >
                    <IconEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(c.id)}
                    className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-stock-no/10 hover:text-stock-no max-lg:h-11 max-lg:w-11"
                    aria-label={`Delete ${c.name}`}
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