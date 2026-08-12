import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header } from './Header'
import { Footer } from './Footer'
import { CartDrawer } from '../cart/CartDrawer'
import { CheckoutModal } from '../checkout/CheckoutModal'
import { FlyToCartProvider } from '../cart/FlyToCart'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
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
      className="min-h-[70vh]"
    >
      <Outlet />
    </motion.main>
  )
}

export function Layout() {
  return (
    <FlyToCartProvider>
      <ScrollToTop />
      <Header />
      <AnimatedOutlet />
      <Footer />
      <CartDrawer />
      <CheckoutModal />
    </FlyToCartProvider>
  )
}