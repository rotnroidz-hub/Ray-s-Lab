import { useEffect, useRef, useState, type ReactNode } from 'react'

interface TitlePlateProps {
  /** Small uppercase mono label, optional. */
  kicker?: string
  /** Heading split into words; each animates separately. */
  words: string[]
  /** Large mono number on the right, counts up on every entry. */
  count?: number
  /** Small mono label under the count. */
  countLabel?: string
  /** Row beneath the rule: chips, buttons, a sentence. */
  children?: ReactNode
}

const css = `
  .tp-mask { display: inline-block; overflow: hidden; vertical-align: top; }
  .tp-word { display: inline-block; transform: translateY(112%); will-change: transform; }
  .tp-on .tp-word { animation: tp-rise 0.72s cubic-bezier(0.19,1,0.22,1) both; }
  @keyframes tp-rise { from { transform: translateY(112%); } to { transform: translateY(0); } }

  .tp-sweep { position: absolute; top: 0; bottom: 0; left: -100px; width: 80px; background: linear-gradient(90deg, transparent, rgba(0,144,230,0.13), transparent); }
  .tp-on .tp-sweep { animation: tp-sweep-move 1.05s ease both; }
  @keyframes tp-sweep-move { from { left: -100px; } to { left: 110%; } }

  .tp-rule { transform: scaleX(0); transform-origin: left; }
  .tp-on .tp-rule { animation: tp-rule-in 0.6s ease 0.26s both; }
  @keyframes tp-rule-in { from { transform: scaleX(0); } to { transform: scaleX(1); } }

  @media (prefers-reduced-motion: reduce) {
    .tp-word { transform: translateY(0); animation: none !important; }
    .tp-rule { transform: scaleX(1); animation: none !important; }
    .tp-sweep { display: none; }
  }
`

/**
 * Approved section heading treatment. The CSS animations restart on every
 * viewport entry: on intersect we drop the `.tp-on` class, force a reflow, then
 * re-add it; the counter interval is cleared and the number reset to 0 on exit
 * so it ticks up from zero each time. Under prefers-reduced-motion everything
 * renders in its final state and no observers toggle anything.
 */
export function TitlePlate({ kicker, words, count, countLabel, children }: TitlePlateProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayed(count ?? 0)
      setOn(true)
      return
    }

    let visible = false
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !visible) {
          visible = true
          el.classList.remove('tp-on')
          void el.offsetWidth
          el.classList.add('tp-on')
          setOn(true)
        } else if (!entry.isIntersecting && visible) {
          visible = false
          el.classList.remove('tp-on')
          setOn(false)
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [count])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayed(count ?? 0)
      return
    }
    if (!on) {
      setDisplayed(0)
      return
    }
    if (count == null) {
      setDisplayed(0)
      return
    }
    setDisplayed(0)
    const duration = 1200
    const start = performance.now()
    const id = window.setInterval(() => {
      const p = Math.min((performance.now() - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplayed(Math.round(count * eased))
      if (p >= 1) window.clearInterval(id)
    }, 30)
    return () => window.clearInterval(id)
  }, [on, count])

  return (
    <div
      ref={wrapRef}
      className={`edge relative bg-paper-2 rounded-card px-7 pt-6 pb-5 overflow-hidden${on ? ' tp-on' : ''}`}
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 1px 2px rgba(14,16,19,0.04)' }}
    >
      <span aria-hidden className="tp-bracket" style={{ position: 'absolute', top: 10, left: 10, width: 14, height: 14, border: '1.5px solid #0090E6', borderRight: 0, borderBottom: 0 }} />
      <span aria-hidden className="tp-bracket" style={{ position: 'absolute', bottom: 10, right: 10, width: 14, height: 14, border: '1.5px solid #0090E6', borderLeft: 0, borderTop: 0 }} />
      <span aria-hidden className="tp-sweep" />

      <div className="relative">
        {kicker ? (
          <p className="mb-3 font-mono text-[11.5px] uppercase tracking-[0.14em] text-blue-deep">{kicker}</p>
        ) : null}

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="font-display text-[clamp(30px,4vw,46px)] leading-[1.05]">
            {words.map((w, i) => (
              <span key={`${w}-${i}`} className="tp-mask">
                <span className="tp-word" style={{ animationDelay: `${i * 90}ms` }}>
                  {w}
                </span>
                {i < words.length - 1 ? '\u00A0' : ''}
              </span>
            ))}
          </h2>

          {count != null ? (
            <div className="shrink-0 text-left md:text-right">
              <div className="font-mono text-[30px] font-medium tabular-nums text-ink">{displayed}</div>
              {countLabel ? (
                <div className="mt-0.5 font-mono text-[11.5px] uppercase tracking-[0.08em] text-ink-soft">
                  {countLabel}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="tp-rule mt-5 h-px bg-line" />

        {children ? <div className="relative mt-5">{children}</div> : null}
      </div>

      <style>{css}</style>
    </div>
  )
}