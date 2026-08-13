import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSeo } from '../lib/seo'
import { cn } from '../lib/utils'
import { IconLogOut } from '../components/ui/Icons'

const nav = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products', end: false },
  { to: '/admin/categories', label: 'Categories', end: false },
  { to: '/admin/brands', label: 'Brands', end: false },
  { to: '/admin/banners', label: 'Banners', end: false },
]

export function AdminLayout() {
  const navigate = useNavigate()
  // Admin area must not appear in search indexes (Section 7 note).
  useSeo({ title: 'Admin', robots: 'noindex,follow' })

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper lg:flex-row">
      <aside className="flex items-center justify-between gap-4 border-b border-ink/8 px-5 py-4 lg:min-h-screen lg:w-60 lg:flex-col lg:items-stretch lg:justify-start lg:border-b-0 lg:border-r lg:px-0 lg:py-8">
        <Link to="/admin/products" className="lg:px-6">
          <span className="font-display text-lg font-semibold text-ink">Admin</span>
          <span className="ml-2 hidden text-xs text-ink-faint lg:inline">/ control room</span>
        </Link>

        <nav className="flex items-center gap-1 lg:mt-8 lg:flex-col lg:items-stretch" aria-label="Admin">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                  isActive ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-ink/5 hover:text-ink',
                  'lg:mx-3',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 lg:mt-auto lg:flex-col lg:items-stretch lg:px-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
          >
            View store ↗
          </a>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-stock-no transition-colors hover:bg-stock-no/10"
          >
            <IconLogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 px-5 py-8 lg:px-10 lg:py-10">
        <Outlet />
      </main>
    </div>
  )
}