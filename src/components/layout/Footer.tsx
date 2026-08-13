import { Link } from 'react-router-dom'
import { SITE_NAME, WHATSAPP_NUMBER } from '../../lib/constants'
import { whatsappLink } from '../../lib/whatsapp'
import { useCategories } from '../../hooks/useData'
import { IconWhatsApp } from '../ui/Icons'

export function Footer() {
  const { data: categories } = useCategories()

  return (
    <footer className="mt-20 border-t border-ink/8 bg-ink text-paper/85">
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-semibold text-paper">{SITE_NAME}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-paper/70">
            Carefully chosen essentials, ordered in a single message. Browse, add to basket, and
            send your order to us directly on WhatsApp.
          </p>
        </div>

        <div>
          <p className="eyebrow text-paper/60">Shop</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link to="/catalog" className="transition-colors hover:text-paper">
                All Products
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link to={`/category/${c.slug}`} className="transition-colors hover:text-paper">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow text-paper/60">Contact</p>
          {WHATSAPP_NUMBER ? (
            <a
              href={whatsappLink('Hello! I have a question about your catalog.')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm transition-colors hover:text-paper"
            >
              <IconWhatsApp className="h-5 w-5" />
              Chat with us on WhatsApp
            </a>
          ) : (
            <p className="mt-4 text-sm text-paper/70">
              Orders &amp; enquiries via WhatsApp — number coming soon.
            </p>
          )}
        </div>

        <div>
          <p className="eyebrow text-paper/60">Ordering</p>
          <p className="mt-4 text-sm leading-relaxed text-paper/70">
            No accounts, no payment gateways — build your basket and send it to us. We reply with
            pricing, availability and delivery details.
          </p>
        </div>
      </div>

      <div className="border-t border-paper/10 py-5">
        <div className="container-site flex flex-col items-center justify-between gap-2 text-xs text-paper/50 sm:flex-row">
          <span>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</span>
          <span>Prices subject to confirmation over WhatsApp.</span>
        </div>
      </div>
    </footer>
  )
}