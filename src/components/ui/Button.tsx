import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'dark' | 'outline' | 'ghost' | 'ghost-dark' | 'danger' | 'whatsapp'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-sans text-[14.5px] font-medium ' +
  'whitespace-nowrap transition-all duration-200 active:translate-y-[1px] ' +
  'select-none disabled:pointer-events-none disabled:opacity-40'

const variants: Record<Variant, string> = {
  primary: 'bg-blue text-white hover:bg-[#0a9ff5] shadow-[0_6px_20px_rgba(0,144,230,0.28)]',
  dark: 'bg-ink text-paper-2 hover:bg-ink-2',
  outline: 'bg-card text-ink border border-line hover:border-ink',
  ghost: 'text-ink hover:bg-ink/5',
  'ghost-dark': 'bg-transparent text-paper-2 border border-white/30 hover:border-paper-2',
  danger: 'bg-stock-no text-paper hover:brightness-95',
  whatsapp: 'bg-[#1FA559] text-white hover:brightness-95',
}

const sizes: Record<Size, string> = {
  sm: 'h-10 px-4 max-md:min-h-[44px]',
  md: 'h-12 px-6',
  lg: 'h-[54px] px-8',
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