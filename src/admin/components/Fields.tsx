import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function Field({
  label,
  hint,
  children,
  className,
  required,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
  required?: boolean
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {required && <span className="ml-0.5 text-clay">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-ink-muted">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-2xl border border-ink/15 bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-pine focus:bg-canvas'

export function Toggle({
  checked,
  onChange,
  label,
  activeLabel,
  inactiveLabel,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  activeLabel: string
  inactiveLabel: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-ink/15 bg-canvas p-4 text-left"
    >
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="mt-0.5 block text-xs text-ink-muted">
          {checked ? activeLabel : inactiveLabel}
        </span>
      </span>
      <span
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300',
          checked ? 'bg-pine' : 'bg-ink/15',
        )}
      >
        <span
          className={cn(
            'absolute top-1 h-5 w-5 rounded-full bg-canvas shadow transition-all duration-300',
            checked ? 'left-6' : 'left-1',
          )}
        />
      </span>
    </button>
  )
}