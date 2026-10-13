// Shared brand-chip colour logic, used by the storefront (Catalog brand chips)
// and the admin ChipPreview so the two can never drift. Will be reused later on
// product cards and brand pages.
//
// A brand supplies two hex colours (color_primary / color_secondary, #RRGGBB,
// both nullable — see supabase/migrations/20261013_brand_colors.sql). When both
// are present we render a soft linear gradient across the pill and compute a
// single label colour with enough contrast to stay legible over both ends. When
// either is null we return null and the caller falls back to the default cream
// pill exactly as it renders today.

/** Mirrors the DB CHECK constraints brands_color_*_hex_check: #RRGGBB only. */
export const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/

export function isHexColor(value: string | null | undefined): value is string {
  return typeof value === 'string' && HEX_COLOR_RE.test(value)
}

/** WCAG 2.x relative luminance of an #RRGGBB colour (0 = black, 1 = white). */
export function relativeLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const chan = (shift: number) => {
    const c = ((n >> shift) & 255) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * chan(16) + 0.7152 * chan(8) + 0.0722 * chan(0)
}

/** WCAG contrast ratio between two relative luminances (1–21). */
function contrastRatio(a: number, b: number): number {
  const lighter = Math.max(a, b)
  const darker = Math.min(a, b)
  return (lighter + 0.05) / (darker + 0.05)
}

// Label candidates. They match the ink and card/paper tones in tailwind.config
// so a computed label never looks foreign against the rest of the UI.
const LABEL_DARK = '#0E1013' // ink
const LABEL_LIGHT = '#FFFFFF'

/**
 * Pick one label colour (black-ish or white) that stays legible across the
 * whole gradient. We take the darker of the two brand colours as the binding
 * constraint, then choose whichever candidate maximises the worst-case WCAG
 * contrast against BOTH colours. Anchoring on the darker colour alone would be
 * unsafe: a black→white gradient's darker end demands a light label, which the
 * light end would then swallow. Taking the min contrast over both endpoints is
 * the only single-colour choice that cannot produce an unreadable chip.
 */
export function chipLabelColor(primary: string, secondary: string): string {
  const lums = [relativeLuminance(primary), relativeLuminance(secondary)]
  let best = LABEL_DARK
  let bestScore = -1
  for (const candidate of [LABEL_DARK, LABEL_LIGHT]) {
    const score = Math.min(...lums.map((l) => contrastRatio(l, relativeLuminance(candidate))))
    if (score > bestScore) {
      bestScore = score
      best = candidate
    }
  }
  return best
}

/** Inline styles for a gradient chip, or null → default cream pill. */
export interface BrandChipPaint {
  backgroundImage: string
  color: string
}

/**
 * Build the chip paint for a brand, or null when either colour is missing or
 * malformed (the DB CHECK already rejects malformed values; this is a second
 * line of defence so a bad row degrades to the cream pill instead of a broken
 * chip). The gradient is a soft left-to-right blend from primary to secondary
 * with the 50% midpoint being the exact half-blend.
 */
export function brandChipPaint(
  primary: string | null | undefined,
  secondary: string | null | undefined,
): BrandChipPaint | null {
  if (!isHexColor(primary) || !isHexColor(secondary)) return null
  return {
    backgroundImage: `linear-gradient(90deg, ${primary} 0%, ${secondary} 100%)`,
    color: chipLabelColor(primary, secondary),
  }
}
