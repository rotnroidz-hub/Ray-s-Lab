import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { CartItem } from '../lib/types'

const STORAGE_KEY = 'wc-cart-v1'

export interface AddableItem {
  id: string
  name: string
  slug: string
  price: number
  image: string | null
  stock_status: 'available' | 'no_stock'
}

interface CartContextValue {
  items: CartItem[]
  /** Unique product count (for the header badge), not total qty. */
  itemCount: number
  totalQty: number
  subtotal: number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (item: AddableItem, qty?: number) => void
  setQty: (productId: string, qty: number) => void
  removeItem: (productId: string) => void
  clear: () => void
  isCheckoutOpen: boolean
  openCheckout: () => void
  closeCheckout: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function readStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartItem[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((i) => i && typeof i.product_id === 'string' && i.qty > 0)
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStorage)
  const [isOpen, setIsOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const hydrated = useRef(false)

  // Persist on every change, but not on first mount (reads from storage above).
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true
      return
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Storage full or blocked — cart just won't persist, nothing to do.
    }
  }, [items])

  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])
  const openCheckout = useCallback(() => setIsCheckoutOpen(true), [])
  const closeCheckout = useCallback(() => setIsCheckoutOpen(false), [])
  const clear = useCallback(() => setItems([]), [])

  const addItem = useCallback((item: AddableItem, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === item.id)
      if (existing) {
        return prev.map((i) =>
          i.product_id === item.id ? { ...i, qty: Math.min(i.qty + qty, 99) } : i,
        )
      }
      return [
        ...prev,
        {
          product_id: item.id,
          name: item.name,
          slug: item.slug,
          price: item.price,
          image: item.image,
          stock_status: item.stock_status,
          qty,
        },
      ]
    })
  }, [])

  const setQty = useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === productId ? { ...i, qty: Math.max(0, Math.min(qty, 99)) } : i,
      ),
    )
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId))
  }, [])

  const { itemCount, totalQty, subtotal } = useMemo(() => {
    let totalQty = 0
    let subtotal = 0
    for (const i of items) {
      totalQty += i.qty
      subtotal += i.qty * i.price
    }
    return { itemCount: items.length, totalQty, subtotal }
  }, [items])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      totalQty,
      subtotal,
      isOpen,
      openCart,
      closeCart,
      addItem,
      setQty,
      removeItem,
      clear,
      isCheckoutOpen,
      openCheckout,
      closeCheckout,
    }),
    [items, itemCount, totalQty, subtotal, isOpen, openCart, closeCart, addItem, setQty, removeItem, clear, isCheckoutOpen, openCheckout, closeCheckout],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}