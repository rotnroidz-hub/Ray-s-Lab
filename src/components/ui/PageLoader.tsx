import { IconCart } from './Icons'

/** Full-page loader shown while lazy route chunks download. */
export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" aria-busy>
      <IconCart className="h-8 w-8 animate-pulse text-pine" />
    </div>
  )
}