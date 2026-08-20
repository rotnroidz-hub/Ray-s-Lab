import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { useCart } from '../../hooks/useCart'
import { cn, formatPrice } from '../../lib/utils'
import { responsiveImage } from '../../lib/image'
import { QuantityStepper } from '../ui/QuantityStepper'
import { LinkButton, Button } from '../ui/Button'
import { IconArrowRight, IconCart, IconClose, IconTrash } from '../ui/Icons'

function EmptyCart() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-paper-2 text-ink/40">
        <IconCart className="h-8 w-8" />
      </span>
      <p className="font-display text-xl text-ink">Your basket is empty</p>
      <p className="max-w-xs text-sm text-ink-faint">
        Browse the catalog and add a few things you like, then send the order to us in one tap.
      </p>
      <LinkButton to="/catalog" size="lg" className="w-full">
        Browse the catalog
      </LinkButton>
    </div>
  )
}

export function CartDrawer() {
  const { isOpen, closeCart, items, setQty, removeItem, subtotal, totalQty, openCheckout } = useCart()
  const dragControls = useDragControls()
  // The drawer is a bottom sheet below 640px and the right-hand drawer at 640px
  // and up. The slide direction is a framer-motion variant choice driven by a
  // matchMedia listener, not Tailwind responsive classes, so a reduced-motion /
  // non-CSS-animation path still slides the sheet up instead of in from the right.
  const [isSheet, setIsSheet] = useState(() => window.matchMedia('(max-width: 639px)').matches)
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 639px)')
    const onChange = (e: MediaQueryListEvent) => setIsSheet(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const sheet = isSheet
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
    : { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            key="backdrop"
            type="button"
            aria-label="Close cart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 cursor-default bg-ink/40 backdrop-blur-[2px]"
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={sheet.initial}
            animate={sheet.animate}
            exit={sheet.exit}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            drag={isSheet ? 'y' : false}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 600) closeCart()
            }}
            className={cn(
              'fixed z-50 flex flex-col bg-paper shadow-lift',
              isSheet
                ? 'inset-x-0 bottom-0 max-h-[88dvh] w-full rounded-t-[18px] pb-[env(safe-area-inset-bottom)]'
                : 'inset-y-0 right-0 w-full max-w-md',
            )}
          >
            {isSheet && (
              <div
                className="flex h-11 shrink-0 cursor-grab touch-none items-center justify-center"
                onPointerDown={(e) => dragControls.start(e.nativeEvent)}
              >
                <span className="h-1 w-9 rounded-full bg-ink/20" />
              </div>
            )}

            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-ink">
                Your basket <span className="text-sm font-normal text-ink-faint">({totalQty})</span>
              </h2>
              <button
                type="button"
                onClick={closeCart}
                className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-ink/5"
                aria-label="Close cart"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <EmptyCart />
            ) : (
              <>
                <ul className="flex-1 divide-y divide-ink/8 overflow-y-auto px-5">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={item.product_id}
                        layout
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                        className="flex gap-4 py-4"
                      >
                        <Link to={`/product/${item.slug}`} onClick={closeCart} className="shrink-0">
                          {item.image ? (
                            <img
                              src={responsiveImage(item.image, 160)}
                              alt={item.name}
                              loading="lazy"
                              className="h-20 w-16 rounded-xl object-cover"
                            />
                          ) : (
                            <span className="block h-20 w-16 rounded-xl bg-paper-2" />
                          )}
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              to={`/product/${item.slug}`}
                              onClick={closeCart}
                              className="truncate text-sm font-semibold text-ink hover:text-ink"
                            >
                              {item.name}
                            </Link>
                            <button
                              type="button"
                              onClick={() => removeItem(item.product_id)}
                              className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-ink-faint transition-colors hover:bg-stock-no/10 hover:text-stock-no"
                              aria-label={`Remove ${item.name}`}
                            >
                              <IconTrash className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="mt-0.5 text-sm text-ink-faint">{formatPrice(item.price)}</p>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <QuantityStepper
                              size="sm"
                              value={item.qty}
                              onChange={(qty) => setQty(item.product_id, qty)}
                            />
                            <span className="text-sm font-semibold tabular-nums text-ink">
                              {formatPrice(item.price * item.qty)}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <div className="border-t border-ink/10 px-5 py-4">
                  <div className="flex items-center justify-between pb-3">
                    <span className="text-sm font-medium text-ink-soft">Subtotal</span>
                    <span className="font-display text-xl font-semibold text-ink">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium text-ink-soft">Delivery</span>
                    <span className="text-sm font-medium text-ink-faint">Calculated at checkout</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-ink/10 py-3">
                    <span className="text-base font-semibold text-ink">Total</span>
                    <span className="font-display text-xl font-semibold text-ink">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <Button
                    variant="whatsapp"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      openCheckout()
                      closeCart()
                    }}
                  >
                    Checkout via WhatsApp <IconArrowRight className="h-4 w-4" />
                  </Button>
                  <p className="pt-3 text-center text-xs text-ink-faint">
                    You'll review your order before sending. No payment is taken here.
                  </p>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}