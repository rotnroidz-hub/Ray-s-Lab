import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Lowercase, URL-safe slug. Falls back to `item-<n>` when nothing survives. */
export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'item'
}

export function formatPrice(value: number): string {
  const currency = import.meta.env.VITE_CURRENCY || 'USD'
  const label = import.meta.env.VITE_CURRENCY_LABEL || ''
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
  return label ? `${label}${formatted.replace(/[^0-9.,\s]/g, '') || formatted}` : formatted
}

export function clampPrice(value: string): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, n)
}

/** Reads a single form field out of the array of strings produced by
 *  react-router's useParams on an OR route. */
export function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}