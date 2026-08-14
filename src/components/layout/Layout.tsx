import { useEffect, useLayoutEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header } from './Header'
import { Footer } from './Footer'
import { CartDrawer } from '../cart/CartDrawer'
import { CheckoutModal } from '../checkout/CheckoutModal'
import { FlyToCartProvider } from '../cart/FlyToCart'
import { ToastProvider } from '../ui/Toast'

const SCROLL_KEY_PREFIX = 'site-scroll:'

function getSavedScroll(pathname: string): number | null {
  const raw = sessionStorage.getItem(SCROLL_KEY_PREFIX + pathname)
  if (raw === null) return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

function clearSavedScrolls() {
  const stale: string[] = []
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key && key.startsWith(SCROLL_KEY_PREFIX)) stale.push(key)
  }
  stale.forEach((k) => sessionStorage.removeItem(k))
}

function instantTop() {
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
}

/**
 * Restore a saved scroll position once the incoming page has rendered tall
 * enough to hold it, so the restore is never clamped by a short skeleton
 * frame. Instant (never smooth) and fails safe to the saved value.
 */
function restoreScroll(target: number) {
  const deadline = performance.now() + 2000
  const tryRestore = () => {
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0)
    if (maxScroll >= target || performance.now() >= deadline) {
      window.scrollTo({ top: target, behavior: 'instant' as ScrollBehavior })
    } else {
      requestAnimationFrame(tryRestore)
    }
  }
  tryRestore()
}

/**
 * Persist the window scroll position per pathname in sessionStorage on
 * navigation away, and restore it (instantly, after content renders) when that
 * pathname is shown again. Keyed by pathname — never by route location.key —
 * so the header logo/Home link (a fresh navigation to a previously visited
 * path) still restores, as do the back button and breadcrumb links. A first
 * page load and any path not yet visited start at the top.
 */
function ScrollToTop() {
  const { pathname } = useLocation()
  const pathRef = useRef(pathname)
  const scrollByPath = useRef<Record<string, number>>({})
  const ready = useRef(false)

  useEffect(() => {
    const onScroll = () => {
      scrollByPath.current[pathRef.current] = window.scrollY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useLayoutEffect(() => {
    const from = pathRef.current
    const to = pathname
    pathRef.current = to

    // Fresh page load: ignore anything saved by an earlier load in this tab
    // and settle at the top, just like a brand-new visit.
    if (!ready.current) {
      ready.current = true
      if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
      clearSavedScrolls()
      instantTop()
      return
    }

    if (from !== to) {
      sessionStorage.setItem(
        SCROLL_KEY_PREFIX + from,
        String(Math.max(0, Math.round(scrollByPath.current[from] ?? window.scrollY))),
      )
    }

    const saved = getSavedScroll(to)
    if (saved === null) instantTop()
    else restoreScroll(saved)
  }, [pathname])

  return null
}

/**
 * Route-level transition: fade + gentle rise instead of a hard page jump.
 *
 * Keyed by pathname so every client-side navigation (category→category,
 * product→product, any route swap) remounts the route fresh and the page's
 * data hooks re-run on every navigation — not only on first mount / full
 * refresh. (Search's ?q= changes are handled inside Search itself because
 * remounting on keystrokes would drop input focus.)
 *
 * Deliberately no AnimatePresence: wrapping a shared <Outlet/> in mode="wait"
 * keeps the exiting page's outlet mounted against the new route context and
 * can leave the page blank/stale until a manual refresh.
 */
function AnimatedOutlet() {
  const location = useLocation()
  return (
    <motion.main
      key={location.pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-[1] min-h-[70vh]"
    >
      <Outlet />
    </motion.main>
  )
}

export function Layout() {
  return (
    <ToastProvider>
      <FlyToCartProvider>
        <div className="tex-layer tex-emboss" aria-hidden />
        <div className="tex-layer tex-tint" aria-hidden />
        <div className="tex-layer tex-grain" aria-hidden />
        <div className="relative z-[1]">
          <ScrollToTop />
          <Header />
          <AnimatedOutlet />
          <Footer />
          <CartDrawer />
          <CheckoutModal />
        </div>
      </FlyToCartProvider>
    </ToastProvider>
  )
}