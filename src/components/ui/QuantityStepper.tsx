import { useCallback } from 'react'
import { IconMinus, IconPlus } from '../ui/Icons'
import { cn } from '../../lib/utils'

interface QuantityStepperProps {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'md'
  className?: string
}

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  size = 'md',
  className,
}: QuantityStepperProps) {
  const dec = useCallback(() => onChange(value - 1), [value, onChange])
  const inc = useCallback(() => onChange(value + 1), [value, onChange])
  const btn =
    'grid place-items-center rounded-lg text-ink transition-colors hover:bg-ink/8 disabled:opacity-30 disabled:hover:bg-transparent'
  const dims = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-ink/15 bg-paper-2 px-1',
        className,
      )}
    >
      <button
        type="button"
        className={cn(btn, dims)}
        onClick={dec}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <IconMinus className="h-4 w-4" />
      </button>
      <span className={cn('min-w-7 text-center font-semibold tabular-nums', size === 'sm' ? 'text-sm' : 'text-base')}>
        {value}
      </span>
      <button
        type="button"
        className={cn(btn, dims)}
        onClick={inc}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <IconPlus className="h-4 w-4" />
      </button>
    </div>
  )
}