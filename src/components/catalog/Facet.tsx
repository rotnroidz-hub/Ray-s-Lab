import { cn } from '../../lib/utils'

interface ChipProps {
  label: string
  active: boolean
  onClick: () => void
}

function chip(active: boolean) {
  return cn(
    'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all',
    active
      ? 'bg-ink text-paper shadow-[0_6px_16px_-8px_rgba(47,74,60,0.8)]'
      : 'border border-ink/15 text-ink-soft hover:border-ink/40 hover:text-ink',
  )
}

export function FacetChip({ label, active, onClick }: ChipProps) {
  return (
    <button type="button" onClick={onClick} className={chip(active)} aria-pressed={active}>
      {label}
    </button>
  )
}

interface FacetRowProps {
  label: string
  children: React.ReactNode
}

export function FacetRow({ label, children }: FacetRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide2 text-blue-deep">
        {label}
      </span>
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={label}>
        {children}
      </div>
    </div>
  )
}
