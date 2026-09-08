import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  createProductAdmin,
  getProductAdmin,
  listBrandsAdmin,
  listCategoriesAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  type AdminProductInput,
} from '../../lib/adminApi'
import { useSeo } from '../../lib/seo'
import { slugify } from '../../lib/utils'
import type { Brand, Category, Product, StockStatus } from '../../lib/types'
import { Field, Toggle, inputClass } from '../components/Fields'
import { ImageDropzone } from '../components/ImageDropzone'
import { Button } from '../../components/ui/Button'
import { IconChevronLeft } from '../../components/ui/Icons'

interface FormState {
  name: string
  slug: string
  description: string
  price: string
  category_id: string
  brand_id: string
  stock_status: StockStatus
  is_active: boolean
  images: string[]
  tags: string
  benefits: string
  dosage_cycle: string
  product_note: string
  is_featured: boolean
}

const emptyForm: FormState = {
  name: '',
  slug: '',
  description: '',
  price: '',
  category_id: '',
  brand_id: '',
  stock_status: 'available', // default to "Available Stock" per requirements
  is_active: true,
  images: [],
  tags: '',
  benefits: '',
  dosage_cycle: '',
  product_note: '',
  is_featured: false,
}

export default function ProductForm() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>(emptyForm)
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useSeo({
    title: isEditing ? 'Edit product' : 'New product',
    robots: 'noindex,follow',
  })

  useEffect(() => {
    listCategoriesAdmin().then(setCategories).catch((e) => setError((e as Error).message))
  }, [])

  useEffect(() => {
    listBrandsAdmin().then(setBrands).catch((e) => setError((e as Error).message))
  }, [])

  useEffect(() => {
    if (!isEditing) return
    getProductAdmin(id!)
      .then((p) => {
        if (!p) throw new Error('Product not found')
        setProduct(p)
        setForm({
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: String(p.price),
          category_id: p.category_id ?? '',
          brand_id: p.brand_id ?? '',
          stock_status: p.stock_status,
          is_active: p.is_active,
          images: p.images,
          tags: p.tags.join(', '),
          benefits: p.benefits ?? '',
          dosage_cycle: p.dosage_cycle ?? '',
          product_note: p.product_note ?? '',
          is_featured: p.is_featured,
        })
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [id, isEditing])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function onNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      // Auto-generate slug from the name until the user edits it manually.
      slug: slugTouched ? prev.slug : slugify(name),
    }))
  }

  function buildInput(): AdminProductInput {
    return {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      description: form.description.trim(),
      price: Math.max(0, Number(form.price) || 0),
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
      stock_status: form.stock_status,
      is_active: form.is_active,
      images: form.images,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      benefits: form.benefits.trim() || null,
      dosage_cycle: form.dosage_cycle.trim() || null,
      product_note: form.product_note.trim() || null,
      is_featured: form.is_featured,
      featured_order: form.is_featured ? (product?.featured_order ?? 0) : 0,
    }
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const input = buildInput()
      if (!input.name) throw new Error('Name is required')
      if (isEditing) await updateProductAdmin(id!, input)
      else await createProductAdmin(input)
      navigate('/admin/products')
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  async function remove() {
    setSaving(true)
    try {
      await deleteProductAdmin(id!)
      navigate('/admin/products')
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="py-16 text-center text-sm text-ink-faint">Loading product…</p>
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
      >
        <IconChevronLeft className="h-4 w-4" /> All products
      </Link>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
        {isEditing ? `Edit ${product?.name ?? 'product'}` : 'New product'}
      </h1>
      <p className="mt-1 text-sm text-ink-faint">
        Every field lives on this one screen — save once to publish.
      </p>

      {error && (
        <p role="alert" className="mt-6 rounded-2xl bg-stock-no/10 px-4 py-3 text-sm text-stock-no">
          {error}
        </p>
      )}

      <div className="mt-8 space-y-6">
        <section className="rounded-3xl border border-ink/10 bg-paper-2 p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Name" required className="sm:col-span-2">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="e.g. Aria Wireless Headphones"
              />
            </Field>
            <Field label="Slug" hint="Clean URL — auto-generated from the name.">
              <input
                className={inputClass}
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  set('slug', e.target.value)
                }}
                placeholder="aria-wireless-headphones"
              />
            </Field>
            <Field label="Price" required>
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                placeholder="0.00"
              />
            </Field>
            <Field label="Category" className="sm:col-span-2">
              <select
                className={inputClass}
                value={form.category_id}
                onChange={(e) => set('category_id', e.target.value)}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Brand" hint="Filter facet + landing page." className="sm:col-span-2">
              <select
                className={inputClass}
                value={form.brand_id}
                onChange={(e) => set('brand_id', e.target.value)}
              >
                <option value="">No brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <textarea
                className={inputClass + ' min-h-32 resize-y'}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="What makes it special, key specs, materials…"
              />
            </Field>
            <Field
              label="Benefits"
              hint="Shown on the product page under Benefits. Leave blank to show a placeholder."
              className="sm:col-span-2"
            >
              <textarea
                className={inputClass + ' min-h-32 resize-y'}
                rows={5}
                value={form.benefits}
                onChange={(e) => set('benefits', e.target.value)}
                placeholder="Each benefit on its own line…"
              />
            </Field>
            <Field
              label="Dos and cycle"
              hint={'Shown under "Dos and cycle (for reference only)". Leave blank to show a placeholder.'}
              className="sm:col-span-2"
            >
              <textarea
                className={inputClass + ' min-h-32 resize-y'}
                rows={5}
                value={form.dosage_cycle}
                onChange={(e) => set('dosage_cycle', e.target.value)}
                placeholder="Step-by-step usage…"
              />
            </Field>
            <Field
              label="Note"
              hint="Shown under Note. Leave blank to show a placeholder."
              className="sm:col-span-2"
            >
              <textarea
                className={inputClass + ' min-h-24 resize-y'}
                rows={3}
                value={form.product_note}
                onChange={(e) => set('product_note', e.target.value)}
                placeholder="Anything else the customer should know…"
              />
            </Field>
            <Field label="Tags" hint="Comma-separated. Used by search." className="sm:col-span-2">
              <input
                className={inputClass}
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
                placeholder="wireless, headphones, audio"
              />
            </Field>
          </div>
        </section>

        <section className="rounded-3xl border border-ink/10 bg-paper-2 p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Photos</h2>
          <p className="mt-1 text-xs text-ink-faint">
            First image is the cover. Uploaded to Supabase Storage.
          </p>
          <div className="mt-4">
            <ImageDropzone value={form.images} onChange={(images) => set('images', images)} />
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-ink/10 bg-paper-2 p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Status</h2>
          <Toggle
            label="Stock status"
            checked={form.stock_status === 'available'}
            onChange={(next) => set('stock_status', next ? 'available' : 'no_stock')}
            activeLabel="Customers see a green “Available Stock” badge"
            inactiveLabel="Customers see a red “No Stock” badge"
          />
          <Toggle
            label="Visibility"
            checked={form.is_active}
            onChange={(next) => set('is_active', next)}
            activeLabel="Visible on the storefront"
            inactiveLabel="Hidden from the storefront"
          />
          <Toggle
            label="Handpicked"
            checked={form.is_featured}
            onChange={(next) => set('is_featured', next)}
            activeLabel="Shows in the Handpicked section on the home page. Only the first two are displayed."
            inactiveLabel="Shows in the Handpicked section on the home page. Only the first two are displayed."
          />
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          {isEditing ? (
            confirmDelete ? (
              <div className="rounded-2xl bg-stock-no-soft px-4 py-3 text-sm font-semibold text-stock-no">
                Delete this?{' '}
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={saving}
                  className="ml-3 rounded-lg px-2 py-1 text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void remove()}
                  disabled={saving}
                  className="ml-1 rounded-lg bg-stock-no px-2 py-1 text-paper transition-colors hover:brightness-95 disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            ) : (
              <Button variant="danger" onClick={() => setConfirmDelete(true)} disabled={saving}>
                Delete product
              </Button>
            )
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/admin/products')} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create product'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}