import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Category } from '../../lib/types'
import { responsiveImage } from '../../lib/image'
import { IconArrowRight } from '../ui/Icons'

interface CategoryTileProps {
  category: Category
  index?: number
}

/**
 * Homepage / "Explore more categories" tile. Uses real category photography
 * when available; otherwise falls back to a designed layered treatment
 * (warm gradient + grain + oversized monogram) so it never looks like an
 * empty placeholder.
 */
export function CategoryTile({ category, index = 0 }: CategoryTileProps) {
  const initial = category.name.trim().charAt(0).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.07, 0.35), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={`/category/${category.slug}`}
        className="group relative block overflow-hidden rounded-2xl bg-pine-deep shadow-card transition-shadow duration-300 hover:shadow-lift"
      >
        <div className="relative aspect-[4/5]">
          {category.image_url ? (
            <img
              src={responsiveImage(category.image_url, 600)}
              alt={category.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          ) : (
            <div className="tile-texture relative grid h-full w-full place-items-center">
              <span className="font-display text-7xl font-medium text-canvas/25 transition-all duration-500 group-hover:text-canvas/40">
                {initial}
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-pine-deep/85 via-pine-deep/15 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
            <span className="font-display text-lg font-semibold text-canvas">{category.name}</span>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-canvas/15 text-canvas backdrop-blur-sm transition-all duration-300 group-hover:bg-canvas group-hover:text-pine">
              <IconArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
