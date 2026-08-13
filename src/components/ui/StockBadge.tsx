import { motion } from 'framer-motion'
import type { StockStatus } from '../../lib/types'
import { cn } from '../../lib/utils'

interface StockBadgeProps {
  status: StockStatus
  className?: string
}

/**
 * Green "Available Stock" / red "No Stock" badge with a smooth colour
 * transition when the status flips (Section 6 micro-animation).
 */
export function StockBadge({ status, className }: StockBadgeProps) {
  const available = status === 'available'
  return (
    <motion.span
      layout
      initial={false}
      animate={{ scale: [1, 1.06, 1] }}
      transition={{ duration: 0.5, times: [0, 0.5, 1] }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px]',
        'font-mono uppercase tracking-[0.08em]',
        'transition-colors duration-500',
        available ? 'bg-stock-ok-soft text-stock-ok' : 'bg-stock-no-soft text-stock-no',
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span
          className={cn(
            'inline-flex h-1.5 w-1.5 rounded-full transition-colors duration-500',
            available ? 'bg-stock-ok' : 'bg-stock-no',
          )}
        />
      </span>
      {available ? 'Available Stock' : 'No Stock'}
    </motion.span>
  )
}