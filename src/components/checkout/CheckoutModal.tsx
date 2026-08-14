import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../../hooks/useCart'
import { logCheckout } from '../../lib/api'
import { buildCartMessage, whatsappLink, hasWhatsappNumber } from '../../lib/whatsapp'
import { formatPrice } from '../../lib/utils'
import { Button } from '../ui/Button'
import { IconCheck, IconClose, IconWhatsApp } from '../ui/Icons'

type Stage = 'idle' | 'completing' | 'done'

/**
 * Pre-checkout step: optional name + notes are merged into the WhatsApp
 * message, then the order opens in WhatsApp. Cart is cleared on redirect.
 *
 * Send feedback is immediate: the button flips to a loading state, the link
 * opens ~450ms later so that state has time to paint, then a success state
 * confirms the order before the modal auto-closes.
 *
 * NOTE: context setters are never called during render. The empty-cart case
 * is handled in an effect, not in the render body (that previously caused
 * "Cannot update a component while rendering a different component").
 */
export function CheckoutModal() {
  const { isCheckoutOpen, closeCheckout, items, subtotal, clear } = useCart()
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [stage, setStage] = useState<Stage>('idle')
  const pendingMessage = useRef('')
  const closeTimer = useRef<number | null>(null)

  // Reset transient state whenever the modal opens.
  useEffect(() => {
    if (isCheckoutOpen) {
      setName('')
      setNotes('')
      setStage('idle')
    }
  }, [isCheckoutOpen])

  // Lock body scroll while open.
  useEffect(() => {
    document.body.style.overflow = isCheckoutOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isCheckoutOpen])

  // Clear any pending auto-close timer on unmount.
  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
    }
  }, [])

  // Cart emptied underneath us (last item removed) while the modal is idle.
  // Close via effect, never during render.
  useEffect(() => {
    if (isCheckoutOpen && items.length === 0 && stage === 'idle') {
      closeCheckout()
    }
  }, [isCheckoutOpen, items.length, stage, closeCheckout])

  // Once the user hits send, give the loading state a moment to paint before
  // handing off to WhatsApp, then show success and auto-close. If the modal is
  // closed mid-flight, this cancels instead of opening WhatsApp anyway.
  useEffect(() => {
    if (stage !== 'completing' || !isCheckoutOpen) return
    const openTimer = window.setTimeout(() => {
      const a = document.createElement('a')
      a.href = whatsappLink(pendingMessage.current)
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      a.remove()
      clear()
      setStage('done')
      closeTimer.current = window.setTimeout(closeCheckout, 1500)
    }, 450)
    return () => window.clearTimeout(openTimer)
  }, [stage, isCheckoutOpen, clear, closeCheckout])

  const configured = hasWhatsappNumber()

  function handleSend() {
    if (!configured || stage !== 'idle' || items.length === 0) return
    // Fire and forget so the rail has data. Never awaited: a failure must not
    // delay or alter the WhatsApp redirect.
    void logCheckout(items.map((i) => ({ product_id: i.product_id, qty: i.qty })))
    pendingMessage.current = buildCartMessage(items, name, notes)
    setStage('completing')
  }

  return (
    <AnimatePresence>
      {isCheckoutOpen && (
        <>
          <motion.button
            key="backdrop"
            type="button"
            aria-label="Close checkout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCheckout}
            className="fixed inset-0 z-[60] cursor-default bg-ink/40 backdrop-blur-[2px]"
          />

          <motion.div
            key="panel"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Checkout via WhatsApp"
              initial={{ opacity: 0, y: 48, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-paper shadow-lift sm:max-h-[85vh] sm:rounded-3xl"
            >
              <div className="flex items-start justify-between p-6 pb-4">
                <div>
                  <p className="eyebrow">Almost there</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-ink">Send your order</h2>
                </div>
                <button
                  type="button"
                  onClick={closeCheckout}
                  className="grid h-9 w-9 place-items-center rounded-full text-ink transition-colors hover:bg-ink/5"
                  aria-label="Close checkout"
                >
                  <IconClose className="h-5 w-5" />
                </button>
              </div>

              {!configured && (
                <div className="mx-6 mb-2 rounded-2xl border border-stock-no/30 bg-stock-no/10 p-4 text-sm text-stock-no">
                  WhatsApp number isn't configured yet. Add <code>VITE_WHATSAPP_NUMBER</code> to your
                  environment variables and rebuild.
                </div>
              )}

              {stage === 'idle' ? (
                <>
                  <ul className="mx-6 mb-4 max-h-52 space-y-2 overflow-y-auto">
                    {items.map((item) => (
                      <li key={item.product_id} className="flex items-center justify-between gap-4 text-sm">
                        <span className="min-w-0 truncate text-ink">
                          {item.name} <span className="text-ink-faint">× {item.qty}</span>
                        </span>
                        <span className="shrink-0 tabular-nums text-ink-faint">
                          {formatPrice(item.price * item.qty)}
                        </span>
                      </li>
                    ))}
                    <li className="flex items-center justify-between border-t border-ink/10 pt-3">
                      <span className="font-semibold text-ink">Total</span>
                      <span className="font-display text-lg font-semibold text-ink">{formatPrice(subtotal)}</span>
                    </li>
                  </ul>

                  <form
                    className="space-y-3 px-6 pb-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSend()
                    }}
                  >
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name (optional)"
                      autoComplete="name"
                      className="w-full rounded-2xl border border-ink/15 bg-paper-2 px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:bg-paper"
                    />
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Anything we should know? Size, color, delivery area…"
                      rows={2}
                      className="w-full resize-none rounded-2xl border border-ink/15 bg-paper-2 px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:bg-paper"
                    />
                    <Button
                      type="submit"
                      variant="whatsapp"
                      size="lg"
                      className="w-full"
                      disabled={!configured}
                    >
                      <IconWhatsApp className="h-5 w-5" />
                      Open WhatsApp with my order
                    </Button>
                  </form>
                  <p className="px-6 pb-6 pt-2 text-center text-xs text-ink-faint">
                    We'll confirm price, availability and delivery over chat. No payment is taken on
                    the site.
                  </p>
                </>
              ) : (
                <div className="grid place-items-center px-6 pb-10 pt-4 text-center">
                  {stage === 'completing' ? (
                    <>
                      <span className="h-8 w-8 animate-spin rounded-full border-2 border-ink/15 border-t-ink" />
                      <p className="mt-4 font-display text-lg font-semibold text-ink">
                        Preparing your order…
                      </p>
                      <p className="mt-1 text-sm text-ink-faint">
                        Opening WhatsApp in a moment.
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-ink text-paper">
                        <IconCheck className="h-6 w-6" />
                      </span>
                      <p className="mt-4 font-display text-lg font-semibold text-ink">
                        Order sent!
                      </p>
                      <p className="mt-1 text-sm text-ink-faint">
                        We'll confirm price, availability and delivery over chat.
                      </p>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}