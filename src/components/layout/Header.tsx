import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../../hooks/useCart'
import { useBrandMenu, useCategories } from '../../hooks/useData'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { CART_TARGET_ID } from '../cart/FlyToCart'
import { IconCart, IconChevronDown, IconChevronRight, IconClose, IconMenu, IconSearch } from '../ui/Icons'
import type { BrandMenuEntry } from '../../lib/api'

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-[11px] text-ink">
      <img src="/logo-mark.png" alt="" loading="lazy" width={474} height={424} className="h-[46px] w-auto" />
      <span className="font-display font-extrabold text-[17px] leading-[1.02] tracking-[-0.02em]">
        RAY<br />
        BODY<em className="not-italic text-blue">LAB</em>
      </span>
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
        className="w-full rounded-full border border-ink/15 bg-paper-2 py-2.5 pl-11 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:bg-paper"
      />
      <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-faint" />
    </form>
  )
}

/** Desktop Brands mega menu (lg and up): brand list + per-brand categories. */
function BrandsMegaMenu() {
  const { data: menu } = useBrandMenu()
  const [open, setOpen] = useState(false)
  // The trap only arms when the menu was opened by click or keyboard, never
  // from mouse hover alone.
  const [trapArmed, setTrapArmed] = useState(false)
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (active >= menu.length) setActive(0)
  }, [menu, active])

  const closeMenu = () => {
    setOpen(false)
    setTrapArmed(false)
  }

  useFocusTrap({
    active: open && trapArmed,
    containerRef: panelRef,
    onEscape: () => {
      closeMenu()
      triggerRef.current?.focus()
    },
    initialFocus: 'none',
  })

  // Escape while the menu is open from hover only (trap not armed).
  useEffect(() => {
    if (!open || trapArmed) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, trapArmed])

  if (menu.length === 0) return null

  const current = menu[Math.min(active, menu.length - 1)]

  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      setActive((i) => (i + 1) % menu.length)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      setActive((i) => (i - 1 + menu.length) % menu.length)
    } else if (e.key === 'Escape') {
      closeMenu()
      triggerRef.current?.focus()
    }
  }

  return (
    <div
      ref={wrapRef}
      className="group relative"
      onMouseEnter={() => {
        // Hover may open the menu, but it must never arm the trap. Do not
        // disarm a menu that was already opened by click or keyboard.
        if (!open) setTrapArmed(false)
        setOpen(true)
      }}
      onMouseLeave={closeMenu}
      onBlur={(e) => {
        const next = e.relatedTarget as HTMLElement | null
        if (wrapRef.current?.contains(next)) return
        closeMenu()
        // The trap cleanup returns focus to the trigger on deactivate. When
        // the user tabbed onward, put focus back on the element they chose so
        // they are not pulled back into the header.
        if (next && next.isConnected) {
          window.setTimeout(() => next.focus({ preventScroll: true }), 0)
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => {
          setOpen(true)
          setTrapArmed(true)
        }}
        className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-line hover:bg-card"
      >
        Brands
        <IconChevronDown
          className={`h-[15px] w-[15px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onKeyDown={handleKeyDown}
            className="absolute left-0 top-full z-50 mt-3 grid w-[640px] grid-cols-[206px_1fr] overflow-hidden rounded-card border border-line bg-paper-2 shadow-[0_22px_54px_rgba(14,16,19,0.14)]"
          >
            <div className="border-r border-line-soft bg-ink/[0.02] p-2" role="listbox" aria-label="Brands">
              {menu.map((entry, i) => (
                <button
                  key={entry.brand.id}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className={`flex w-full items-center justify-between gap-2 rounded-[9px] px-3 py-[9px] text-left text-sm transition-colors duration-150 ${
                    i === active ? 'bg-ink text-paper-2' : 'text-ink hover:bg-ink/5'
                  }`}
                >
                  {entry.brand.name}
                  <span
                    className={`font-mono text-[11.5px] ${i === active ? 'text-blue' : 'text-ink-faint'}`}
                  >
                    {entry.total}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-[18px_20px]">
              <h3 className="font-display text-[22px] font-extrabold tracking-[-0.03em] text-ink">
                {current.brand.name}
              </h3>
              <p className="mb-[14px] mt-[3px] text-[12.5px] text-ink-soft">
                {current.total} items in stock
              </p>
              <div className="grid grid-cols-2 gap-[7px]">
                {current.categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/catalog?brand=${current.brand.slug}&category=${cat.slug}`}
                    className="flex items-center gap-[9px] rounded-[9px] border border-line-soft bg-card px-[11px] py-[9px] text-[13.5px] text-ink transition-all hover:translate-x-[2px] hover:border-blue"
                  >
                    <IconChevronRight className="h-4 w-4 text-blue-deep" />
                    {cat.name}
                    <span className="ml-auto font-mono text-[11.5px] text-ink-faint">{cat.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Header() {
  const { totalQty, openCart } = useCart()
  const { data: categories } = useCategories()
  const { data: brandMenu } = useBrandMenu()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [stuck, setStuck] = useState(false)
  const [brandsOpen, setBrandsOpen] = useState(false)
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const mobileNavRef = useRef<HTMLElement>(null)
  const location = useLocation()

  useFocusTrap({
    active: menuOpen,
    containerRef: mobileNavRef,
    onEscape: () => setMenuOpen(false),
  })

  // Close menus on navigation.
  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
    setBrandsOpen(false)
    setExpandedBrand(null)
  }, [location.pathname, location.search])

  // Sticky border + shadow driven by a 1px sentinel, not a scroll listener.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), { threshold: 1 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b border-transparent bg-paper/90 backdrop-blur transition-[border-color,box-shadow] duration-300 ${
          stuck ? 'border-line shadow-[0_6px_26px_rgba(14,16,19,0.06)]' : ''
        }`}
      >
        <div className="container-site">
          <div className="flex h-16 items-center justify-between gap-4 lg:h-[78px]">
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-lg text-ink transition-colors hover:bg-ink/5 lg:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <IconClose className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
            </button>

            <Logo />

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
              {brandMenu.length > 0 && <BrandsMegaMenu />}
              {categories.map((c) => (
                <NavLink
                  key={c.id}
                  to={`/category/${c.slug}`}
                  className="rounded-full px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-card hover:text-ink"
                >
                  {c.name}
                </NavLink>
              ))}
              <NavLink
                to="/catalog"
                className="rounded-full px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-card hover:text-ink"
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
                className="grid h-11 w-11 place-items-center rounded-lg text-ink transition-colors hover:bg-ink/5 sm:hidden"
                aria-label="Search"
              >
                <IconSearch className="h-5 w-5" />
              </button>

              <button
                type="button"
                onPointerDown={() => {
                  // Disarm the mobile nav trap on pointerdown so it shuts off
                  // before the cart trap arms on click; never two at once.
                  setMenuOpen(false)
                  setSearchOpen(false)
                }}
                onClick={openCart}
                id={CART_TARGET_ID}
                className="relative grid h-11 w-11 place-items-center rounded-full bg-ink text-paper transition-transform active:scale-95"
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
                      className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-blue-deep px-1 text-[11px] font-bold text-paper"
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
              className="overflow-hidden border-t border-ink/8 bg-paper"
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
              ref={mobileNavRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-ink/8 bg-paper lg:hidden"
            >
              <div className="container-site flex flex-col py-3">
                {brandMenu.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setBrandsOpen((v) => !v)}
                      aria-expanded={brandsOpen}
                      className="flex min-h-[44px] items-center justify-between rounded-xl px-3 py-3 text-base font-semibold text-ink hover:bg-ink/5"
                    >
                      Brands
                      <IconChevronDown
                        className={`h-4 w-4 text-ink-faint transition-transform duration-200 ${
                          brandsOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {brandsOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          {brandMenu.map((entry: BrandMenuEntry) => {
                            const isOpen = expandedBrand === entry.brand.id
                            return (
                              <div key={entry.brand.id}>
                                <button
                                  type="button"
                                  onClick={() => setExpandedBrand(isOpen ? null : entry.brand.id)}
                                  aria-expanded={isOpen}
                                  className="flex min-h-[44px] w-full items-center justify-between rounded-xl px-3 pl-3 text-left text-[15px] font-medium text-ink-soft hover:bg-ink/5"
                                >
                                  <span className="flex items-center gap-2">
                                    <IconChevronRight
                                      className={`h-4 w-4 text-ink-faint transition-transform duration-200 ${
                                        isOpen ? 'rotate-90' : ''
                                      }`}
                                    />
                                    {entry.brand.name}
                                  </span>
                                  <span className="font-mono text-[11.5px] text-ink-faint">
                                    {entry.total}
                                  </span>
                                </button>

                                <AnimatePresence initial={false}>
                                  {isOpen && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                      className="overflow-hidden pl-5"
                                    >
                                      {entry.categories.map((cat) => (
                                        <Link
                                          key={cat.slug}
                                          to={`/catalog?brand=${entry.brand.slug}&category=${cat.slug}`}
                                          className="flex min-h-[44px] items-center justify-between rounded-xl px-3 py-3 text-[15px] font-medium text-ink-soft hover:bg-ink/5"
                                        >
                                          {cat.name}
                                          <span className="font-mono text-[11.5px] text-ink-faint">
                                            {cat.count}
                                          </span>
                                        </Link>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                <Link
                  to="/catalog"
                  className="flex min-h-[44px] items-center justify-between rounded-xl px-3 py-3 text-base font-semibold text-ink hover:bg-ink/5"
                >
                  All Products <IconChevronRight className="h-4 w-4 text-ink-faint" />
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/category/${c.slug}`}
                    className="flex min-h-[44px] items-center justify-between rounded-xl px-3 py-3 text-base font-medium text-ink-soft hover:bg-ink/5"
                  >
                    {c.name} <IconChevronRight className="h-4 w-4 text-ink-faint" />
                  </Link>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* 1px sentinel: leaving the viewport switches the header to its stuck state */}
      <div ref={sentinelRef} aria-hidden className="h-px" />
    </>
  )
}