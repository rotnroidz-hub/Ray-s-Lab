/**
 * Returns a URL optimised for the given rendered width. Supabase Storage
 * images get transform params; external (demo) URLs pass through untouched.
 */
export function responsiveImage(src: string, width: number): string {
  if (!src) return src
  if (src.includes('/storage/v1/object/public/')) {
    const sep = src.includes('?') ? '&' : '?'
    return `${src}${sep}width=${width}&quality=80`
  }
  return src
}