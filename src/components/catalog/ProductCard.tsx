import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Product } from '../../lib/types'
import { formatPrice } from '../../lib/utils'
import { responsiveImage } from '../../lib/image'
import { useCart } from '../../hooks/useCart'
import { useFlyToCart } from '../cart/FlyToCart'
import { useToast } from '../ui/Toast'
import { StockBadge } from '../ui/StockBadge'
import { IconCart } from '../ui/Icons'

interface ProductCardProps {
  product: Product
  index?: number
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem, openCheckout } = useCart()
  const fly = useFlyToCart()
  const { showToast } = useToast()
  const outOfStock = product.stock_status === 'no_stock'
  const image = product.images[0] ?? null

  const handleAdd = useCallback(
    (e: React.MouseEvent) => {
      if (outOfStock) return
      const node = (e.currentTarget as HTMLElement).closest<HTMLElement>('.product-card')
      const img = node?.querySelector('img')
      if (img) {
        const r = img.getBoundingClientRect()
        fly({ x: r.left, y: r.top, width: r.width, height: r.height }, image)
      }
      addItem(
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image,
          stock_status: product.stock_status,
        },
        1,
      )
      showToast(`${product.name} added to cart`)
    },
    [addItem, fly, outOfStock, product, image, showToast],
  )

  const handleBuyNow = useCallback(
    (e: React.MouseEvent) => {
      if (outOfStock) return
      e.preventDefault()
      e.stopPropagation()
      addItem(
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image,
          stock_status: product.stock_status,
        },
        1,
      )
      openCheckout()
    },
    [addItem, openCheckout, outOfStock, product, image],
  )

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="product-card group relative"
    >
      <Link
        to={`/product/${product.slug}`}
        className="block focus:outline-none"
        aria-label={product.name}
      >
        <div className="media-frame relative aspect-[4/5] transition-shadow duration-300 group-hover:shadow-lift">
          {image ? (
            <img
              src={responsiveImage(image, 700)}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-paper-2 text-ink/25">
              <span className="font-display text-4xl">·</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {product.brands?.name && (
              <p className="text-[11px] font-semibold uppercase tracking-wide2 text-blue-deep">
                {product.brands.name}
              </p>
            )}
            <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold text-ink">
              {product.name}
            </h3>
            <p className="mt-1 text-sm font-medium text-ink-faint">{formatPrice(product.price)}</p>
          </div>
          <StockBadge status={product.stock_status} />
        </div>
      </Link>

      <div className="mt-3 grid grid-cols-[1fr_auto] gap-[7px]">
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={outOfStock}
          className="h-10 rounded-full bg-ink px-4 text-[13px] font-medium text-paper-2 transition-colors hover:bg-ink-2 disabled:pointer-events-none disabled:opacity-40"
        >
          Buy now
        </button>
        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock}
          aria-label={outOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card text-ink transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-40"
        >
          <IconCart className="h-5 w-5" />
        </button>
      </div>
    </motion.article>
  )
}