import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../../hooks/useCart'
import { useCategories } from '../../hooks/useData'
import { SITE_NAME } from '../../lib/constants'
import { CART_TARGET_ID } from '../cart/FlyToCart'
import { IconCart, IconChevronRight, IconClose, IconMenu, IconSearch } from '../ui/Icons'

function Logo() {
  const words = SITE_NAME.split(' ')
  return (
    <Link to="/" className="font-display text-xl font-semibold tracking-tight text-ink">
      {words.map((w, i) => (
        <span key={i} className={i === words.length - 1 ? 'text-brass' : ''}>
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Link>
  )
}

function SearchForm() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        const query = q.trim()
        if (!query) return
        navigate(`/search?q=${encodeURIComponent(query)}`)
        setQ('')
      }}
      className="relative w-full"
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search products…"
        aria-label="Search products"
        className="w-full rounded-full border border-ink/15 bg-canvas-deep py-2.5 pl-11 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-pine focus:bg-canvas"
      />
      <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-muted" />
    </form>
  )
}

export function Header() {
  const { totalQty, openCart } = useCart()
  const { data: categories } = useCategories()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()

  // Close menus on navigation.
  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
  }, [location.pathname, location.search])

  return (
    <header className="sticky top-0 z-40 border-b border-ink/8 bg-canvas/85 backdrop-blur-md">
      <div className="container-site">
        <div className="flex h-16 items-center justify-between gap-4 sm:h-20">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg text-ink transition-colors hover:bg-ink/5 lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <IconClose className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
          </button>

          <Logo />

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
            {categories.map((c) => (
              <NavLink
                key={c.id}
                to={`/category/${c.slug}`}
                className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                {c.name}
              </NavLink>
            ))}
            <NavLink
              to="/catalog"
              className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
            >
              All Products
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <SearchForm />
            </div>

            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-lg text-ink transition-colors hover:bg-ink/5 sm:hidden"
              aria-label="Search"
            >
              <IconSearch className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={openCart}
              id={CART_TARGET_ID}
              className="relative grid h-10 w-10 place-items-center rounded-full bg-pine text-canvas shadow-[0_8px_20px_-10px_rgba(47,74,60,0.7)] transition-transform active:scale-95"
              aria-label={`Open cart, ${totalQty} item${totalQty === 1 ? '' : 's'}`}
            >
              <IconCart className="h-5 w-5" />
              <AnimatePresence mode="popLayout">
                {totalQty > 0 && (
                  <motion.span
                    key={totalQty}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brass px-1 text-[11px] font-bold text-canvas"
                  >
                    {totalQty}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile search strip */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-ink/8 bg-canvas"
          >
            <div className="container-site py-3">
              <SearchForm />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-ink/8 bg-canvas lg:hidden"
            aria-label="Mobile"
          >
            <div className="container-site flex flex-col py-3">
              <Link
                to="/catalog"
                className="flex items-center justify-between rounded-xl px-3 py-3 text-base font-semibold text-ink hover:bg-ink/5"
              >
                All Products <IconChevronRight className="h-4 w-4 text-ink-muted" />
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to={`/category/${c.slug}`}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-base font-medium text-ink-soft hover:bg-ink/5"
                >
                  {c.name} <IconChevronRight className="h-4 w-4 text-ink-muted" />
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}