import { useEffect, useRef, useState, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  /** Optional additional delay in seconds, applied on top of the index stagger. */
  delay?: number
  /** Optional index; applies `(index % 4) * 70ms` transition delay. */
  index?: number
  className?: string
}

/**
 * Scroll-triggered reveal that replays every time the element enters the
 * viewport, in either scroll direction. Never unobserves. Respects
 * prefers-reduced-motion by rendering the child statically and never toggling.
 */
export function Reveal({ children, delay = 0, index = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting)
      },
      { threshold: 0.12, rootMargin: '0px 0px -4% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const stagger = (index % 4) * 0.07

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition:
          'opacity 0.65s cubic-bezier(0.19, 1, 0.22, 1), transform 0.65s cubic-bezier(0.19, 1, 0.22, 1)',
        transitionDelay: `${delay + stagger}s`,
      }}
    >
      {children}
    </div>
  )
}