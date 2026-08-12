import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffectOnce } from '../hooks/useEffectOnce'
import { supabase } from '../lib/supabase'
import { useSeo } from '../lib/seo'
import { Button, buttonClass } from '../components/ui/Button'
import { IconLogOut, IconArrowRight } from '../components/ui/Icons'

export function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useSeo({ title: 'Admin', robots: 'noindex,follow' })

  useEffectOnce(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session))
  })

  if (hasSession) return <Navigate to={from(location)} replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) {
      setError("That combination didn't work. Check the email and password.")
      return
    }
    navigate(from(location), { replace: true })
  }

  return (
    <div className="grid min-h-screen place-items-center bg-pine-deep px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl bg-canvas p-8 shadow-lift">
          <p className="eyebrow">Restricted area</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Admin sign in</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            This area is for store staff only. Customers don't need accounts.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-ink/15 bg-canvas-deep px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-pine focus:bg-canvas"
                placeholder="admin@example.com"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-ink/15 bg-canvas-deep px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-pine focus:bg-canvas"
                placeholder="••••••••"
              />
            </label>

            {error && (
              <p role="alert" className="rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'} <IconArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className={buttonClass({ variant: 'ghost', size: 'sm', className: 'text-canvas/70 hover:bg-canvas/10 hover:text-canvas' })}
          >
            <IconLogOut className="h-4 w-4" /> Back to storefront
          </a>
        </div>
      </div>
    </div>
  )
}

function from(location: { state?: unknown }): string {
  if (location.state && typeof location.state === 'object' && 'from' in location.state) {
    const from = (location.state as { from?: string }).from
    if (from) return from
  }
  return '/admin/products'
}