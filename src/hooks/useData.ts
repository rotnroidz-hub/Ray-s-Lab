import { useCallback, useEffect, useState } from 'react'
import { fetchBanners, fetchBrands, fetchCategories, fetchProducts, fetchRelatedProducts, fetchProductBySlug } from '../lib/api'
import type { Banner, Brand, Category, Product } from '../lib/types'
import type { ProductPage } from '../lib/api'

interface AsyncState<T> {
  data: T
  loading: boolean
  error: string | null
}

function useAsync<T>(fn: () => Promise<T>, deps: unknown[], initial: T) {
  const [state, setState] = useState<AsyncState<T>>({ data: initial, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    fn()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ data: initial, loading: false, error: (err as Error).message })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

export function useBanners() {
  return useAsync<Banner[]>(fetchBanners, [], [])
}

export function useCategories() {
  return useAsync<Category[]>(fetchCategories, [], [])
}

export function useBrands() {
  return useAsync<Brand[]>(fetchBrands, [], [])
}

export interface ProductList {
  data: Product[]
  count: number
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
}

const emptyPage: ProductPage = { products: [], count: 0 }

export function useProducts(categorySlug?: string, search?: string, pageSize = 12, brandSlug?: string): ProductList {
  const [page, setPage] = useState(1)
  const result = useAsync<ProductPage>(
    () => fetchProducts({ categorySlug, search, page, pageSize, brandSlug }),
    [categorySlug, search, page, pageSize, brandSlug],
    emptyPage,
  )

  // Reset pagination whenever the query itself changes.
  useEffect(() => {
    setPage(1)
  }, [categorySlug, search, pageSize, brandSlug])

  const products = result.data.products
  const count = result.data.count
  const loadMore = useCallback(() => setPage((p) => p + 1), [])
  const hasMore = products.length < count

  return {
    data: products,
    count,
    loading: result.loading,
    error: result.error,
    hasMore,
    loadMore,
  }
}

export function useProduct(slug: string) {
  return useAsync<Product | null>(() => fetchProductBySlug(slug), [slug], null)
}

export function useRelatedProducts(product: Product | null) {
  return useAsync<Product[]>(
    () => (product ? fetchRelatedProducts(product) : Promise.resolve([])),
    [product?.id],
    [],
  )
}