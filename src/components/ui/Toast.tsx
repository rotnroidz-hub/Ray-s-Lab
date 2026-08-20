import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { IconCircleCheck } from '@tabler/icons-react'

interface ToastContextValue {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

/** Reads the toast API. Must be used inside a <ToastProvider>. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

/**
 * Minimal feedback system: a single centred pill at the bottom of the viewport.
 * Auto-dismisses after 2400ms. Slide-up + fade-in, aria-live polite.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  const showToast = useCallback((msg: string) => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    setMessage(msg)
    timer.current = window.setTimeout(() => setMessage(null), 2400)
  }, [])

  const visible = message !== null

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-hidden={!visible}
        className="pointer-events-none fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 pb-[env(safe-area-inset-bottom)] lg:bottom-7"
      >
        <div
          className={[
            'pointer-events-auto flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm text-paper-2 shadow-drawer',
            'transition-all duration-300 ease-out',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
          ].join(' ')}
        >
          <IconCircleCheck className="h-[18px] w-[18px] text-blue-lite" stroke={2} />
          <span>{message}</span>
        </div>
      </div>
    </ToastContext.Provider>
  )
}