import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'whatsapp'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 select-none disabled:pointer-events-none disabled:opacity-40 whitespace-nowrap'

const variants: Record<Variant, string> = {
  primary:
    'bg-pine text-canvas hover:bg-pine-dark active:scale-[0.98] shadow-[0_8px_20px_-10px_rgba(47,74,60,0.6)]',
  outline:
    'border border-ink/20 bg-transparent text-ink hover:border-ink/50 hover:bg-canvas-deep active:scale-[0.98]',
  ghost: 'text-ink hover:bg-ink/5 active:scale-[0.98]',
  danger: 'bg-clay text-canvas hover:brightness-95 active:scale-[0.98]',
  whatsapp: 'bg-[#1FA559] text-white hover:brightness-95 active:scale-[0.98]',
}

const sizes: Record<Size, string> = {
  sm: 'text-sm px-4 py-2',
  md: 'text-sm px-6 py-3',
  lg: 'text-base px-8 py-4',
}

interface CommonProps {
  variant?: Variant
  size?: Size
  className?: string
  children?: ReactNode
}

export function buttonClass({ variant = 'primary', size = 'md', className }: CommonProps) {
  return cn(base, variants[variant], sizes[size], className)
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & CommonProps

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, children, ...props }, ref) => (
    <button ref={ref} className={buttonClass({ variant, size, className })} {...props}>
      {children}
    </button>
  ),
)
Button.displayName = 'Button'

type LinkButtonProps = { to: string } & CommonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

export function LinkButton({ to, variant, size, className, children, ...props }: LinkButtonProps) {
  return (
    <Link to={to} className={buttonClass({ variant, size, className })} {...props}>
      {children}
    </Link>
  )
}