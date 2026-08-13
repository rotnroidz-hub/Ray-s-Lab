import { Link } from 'react-router-dom'
import { useSeo } from '../lib/seo'

export function NotFound() {
  useSeo({ title: 'Page not found', robots: 'noindex' })
  return (
    <div className="container-site py-28 text-center">
      <p className="font-display text-7xl font-semibold text-ink">404</p>
      <h1 className="mt-4 font-display text-2xl text-ink">This page took a holiday</h1>
      <p className="mt-2 text-sm text-ink-faint">The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="mt-8 inline-flex rounded-full bg-ink px-8 py-3 text-sm font-semibold text-paper transition-all hover:bg-ink-2 active:scale-[0.98]"
      >
        Back to home
      </Link>
    </div>
  )
}