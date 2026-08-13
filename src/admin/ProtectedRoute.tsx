import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEffectOnce } from '../hooks/useEffectOnce'
import { IconCart } from '../components/ui/Icons'

export function ProtectedRoute() {
  const [state, setState] = useState<'loading' | 'authed' | 'guest'>('loading')
  const location = useLocation()

  useEffectOnce(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setState(data.session ? 'authed' : 'guest')
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setState(session ? 'authed' : 'guest')
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  })

  if (state === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center bg-paper">
        <IconCart className="h-8 w-8 animate-pulse text-ink" />
      </div>
    )
  }

  if (state === 'guest') {
    // Requirement: unauthenticated visitors are redirected away from /admin/*.
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}