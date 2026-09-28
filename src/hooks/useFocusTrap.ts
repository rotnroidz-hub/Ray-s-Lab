import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.getClientRects().length > 0 || el === document.activeElement,
  )
}

interface UseFocusTrapOptions {
  active: boolean
  containerRef: RefObject<HTMLElement | null>
  onEscape: () => void
  /**
   * Where focus lands on open. `container` (default) focuses the container
   * itself, which must have `tabIndex={-1}`. `first` moves to the first inner
   * focusable. `none` leaves focus where it is (the header mega menu, whose
   * trigger is usually already focused).
   */
  initialFocus?: 'container' | 'first' | 'none'
}

/**
 * Shared focus management for every overlay: the cart drawer and bottom sheet,
 * the checkout modal, the header mega menu and the mobile nav.
 *
 * While `active` the Tab / Shift+Tab keys cycle inside the container and never
 * leave it, and Escape calls `onEscape`. When `active` turns false, focus is
 * returned to whichever element opened the overlay.
 */
export function useFocusTrap({
  active,
  containerRef,
  onEscape,
  initialFocus = 'container',
}: UseFocusTrapOptions) {
  const openerRef = useRef<Element | null>(null)
  const onEscapeRef = useRef(onEscape)
  onEscapeRef.current = onEscape

  useEffect(() => {
    if (!active) return
    openerRef.current = document.activeElement
    const el = containerRef.current
    if (el && initialFocus !== 'none') {
      if (initialFocus === 'first') {
        const first = getFocusable(el)[0]
        if (first) first.focus()
        else el.focus()
      } else {
        el.focus()
      }
    }
    return () => {
      const opener = openerRef.current
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus({ preventScroll: true })
      }
    }
  }, [active, containerRef, initialFocus])

  useEffect(() => {
    if (!active) return
    const el = containerRef.current
    if (!el) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onEscapeRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const focusables = getFocusable(el)
      if (focusables.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey) {
        if (document.activeElement === first || !el.contains(document.activeElement)) {
          event.preventDefault()
          last.focus()
        }
      } else if (document.activeElement === last || !el.contains(document.activeElement)) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [active, containerRef])
}