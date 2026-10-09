import { WHATSAPP_NUMBER, WHATSAPP_INTRO } from './constants'
import type { CartItem } from './types'
import { formatPrice } from './utils'

export interface OrderLine {
  name: string
  qty: number
  unitPrice: number
}

/** Builds the plain-text order summary pasted into WhatsApp. */
export function buildOrderMessage(lines: OrderLine[], name?: string, notes?: string): string {
  const added = (WHATSAPP_INTRO || 'Hello! I would like to place an order:').trim()
  const parts: string[] = [added]

  if (name?.trim()) parts.push(`\nName: ${name.trim()}`)

  parts.push('')

  const total = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0)

  for (const l of lines) {
    const lineTotal = l.qty * l.unitPrice
    parts.push(
      `• ${l.name}${l.qty > 1 ? ` × ${l.qty}` : ''}\n` +
        `  ${formatPrice(l.unitPrice)} x ${l.qty} = ${formatPrice(lineTotal)}`,
    )
  }

  parts.push('', `Total: ${formatPrice(total)}`)

  if (notes?.trim()) parts.push(`\nNotes: ${notes.trim()}`)

  const body = parts.join('\n')
  // Tell WhatsApp we want "ta" (all), not the phone contact sheet.
  // NBSP from Intl currency formatting becomes a plain space so the text
  // param never carries %C2%A0 (which the wa.me error path re-encodes to
  // %25C2%25A0).
  return `${body.replace(/\u00A0/g, ' ')}\n\n— sent from ${location.origin}`
}

/** Convenience wrapper for a cart snapshot. */
export function buildCartMessage(cart: CartItem[], name?: string, notes?: string): string {
  return buildOrderMessage(
    cart.map((item) => ({
      name: item.name,
      qty: item.qty,
      unitPrice: item.price,
    })),
    name,
    notes,
  )
}

/** wa.me deep link with the message already URL-encoded. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export function hasWhatsappNumber(): boolean {
  return WHATSAPP_NUMBER.length > 0
}