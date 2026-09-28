import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export interface FlyTarget {
  x: number
  y: number
  width: number
  height: number
}

interface FlyItem {
  id: number
  from: FlyTarget
  to: FlyTarget
  image: string | null
}

type FlyFn = (from: FlyTarget, image: string | null) => void

const FlyContext = createContext<FlyFn | null>(null)
const CART_TARGET_ID = 'wc-cart-target'

function readTarget(elementId: string): FlyTarget {
  const el = document.getElementById(elementId)
  if (!el) return { x: window.innerWidth - 64, y: 12, width: 32, height: 32 }
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, width: r.width, height: r.height }
}

let uid = 0

/**
 * Renders flying product thumbnails that swoop to the header cart icon after
 * "Add to cart" is pressed. Exposes `useFlyToCart()` for the trigger buttons.
 */
export function FlyToCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FlyItem[]>([])

  const fly = useCallback<FlyFn>((from, image) => {
    const to = readTarget(CART_TARGET_ID)
    const id = ++uid
    setItems((prev) => [...prev, { id, from, to, image }])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id))
    }, 800)
  }, [])

  const value = useMemo(() => fly, [fly])

  return (
    <FlyContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden>
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              className="absolute"
              style={{ width: item.from.width, height: item.from.height }}
              initial={{
                left: item.from.x,
                top: item.from.y,
                opacity: 1,
                scale: 1,
                rotate: 0,
              }}
              animate={{
                left: item.to.x + item.to.width / 2 - item.from.width / 2,
                top: item.to.y + item.to.height / 2 - item.from.height / 2,
                opacity: 0.35,
                scale: 0.25,
                rotate: 8,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  className="h-full w-full rounded-lg object-cover shadow-card"
                  loading="eager"
                  width={160}
                  height={160}
                  draggable={false}
                />
              ) : (
                <div className="h-full w-full rounded-lg bg-ink shadow-card" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </FlyContext.Provider>
  )
}

export function useFlyToCart(): FlyFn {
  const ctx = useContext(FlyContext)
  if (!ctx) throw new Error('useFlyToCart must be used within FlyToCartProvider')
  return ctx
}

export { CART_TARGET_ID }