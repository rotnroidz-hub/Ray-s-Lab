import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../../hooks/useCart'
import { formatPrice } from '../../lib/utils'
import { responsiveImage } from '../../lib/image'
import { QuantityStepper } from '../ui/QuantityStepper'
import { LinkButton, Button } from '../ui/Button'
import { IconArrowRight, IconCart, IconClose, IconTrash } from '../ui/Icons'

function EmptyCart() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-canvas-deep text-ink/40">
        <IconCart className="h-8 w-8" />
      </span>
      <p className="font-display text-xl text-ink">Your basket is empty</p>
      <p className="max-w-xs text-sm text-ink-muted">
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

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

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
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-canvas shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-ink">
                Your basket <span className="text-sm font-normal text-ink-muted">({totalQty})</span>
              </h2>
              <button
                type="button"
                onClick={closeCart}
                className="grid h-9 w-9 place-items-center rounded-full text-ink transition-colors hover:bg-ink/5"
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
                            <span className="block h-20 w-16 rounded-xl bg-pine-soft" />
                          )}
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              to={`/product/${item.slug}`}
                              onClick={closeCart}
                              className="truncate text-sm font-semibold text-ink hover:text-pine"
                            >
                              {item.name}
                            </Link>
                            <button
                              type="button"
                              onClick={() => removeItem(item.product_id)}
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-ink-muted transition-colors hover:bg-clay/10 hover:text-clay"
                              aria-label={`Remove ${item.name}`}
                            >
                              <IconTrash className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="mt-0.5 text-sm text-ink-muted">{formatPrice(item.price)}</p>
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
                  <p className="pt-3 text-center text-xs text-ink-muted">
                    You'll review your order before sending — no payment is taken here.
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