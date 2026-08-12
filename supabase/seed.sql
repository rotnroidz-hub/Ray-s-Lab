-- ============================================================================
-- Sample data (OPTIONAL). Run after schema.sql to see a populated storefront.
-- These are placeholder demo products — replace images/content in the admin.
-- ============================================================================

insert into categories (name, slug, sort_order) values
  ('Audio',      'audio',      1),
  ('Wearables',  'wearables',  2),
  ('Accessories','accessories',3)
on conflict (slug) do nothing;

insert into products (category_id, name, slug, description, price, stock_status, is_active, images, tags)
select c.id, p.name, p.slug, p.description, p.price, p.stock_status, p.is_active, p.images::text[], p.tags::text[]
from (values
  ('audio', 'Aria Wireless Headphones', 'aria-wireless-headphones',
   'Over-ear headphones tuned for rich, warm sound. Up to 40h battery, plush memory-foam earcups and multipoint Bluetooth.',
   189.00, 'available', true, '{"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80"}', '{audio,wireless,headphones}'),
  ('audio', 'Pulse Portable Speaker', 'pulse-portable-speaker',
   'Pocket-sized 360° speaker with IPX7 waterproofing and 12h playtime. The centerpiece of any picnic.',
   79.00, 'available', true, '{"https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=80"}', '{audio,speaker,portable}'),
  ('wearables', 'Ridge Smart Watch', 'ridge-smart-watch',
   'Always-on AMOLED display, heart-rate and sleep tracking, 10-day battery. Works with iOS and Android.',
   249.00, 'no_stock', true, '{"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80"}', '{watch,wearable,fitness}'),
  ('wearables', 'Trail Runner Band', 'trail-runner-band',
   'Lightweight silicone band with an activity ring, built-in GPS and a rugged aluminium body.',
   129.00, 'available', true, '{"https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=1200&q=80"}', '{fitness,band,tracker}'),
  ('accessories', 'Voyage Canvas Backpack', 'voyage-canvas-backpack',
   'Waxed-canvas 22L pack with a padded 15" laptop sleeve, brass hardware and lifetime repair promise.',
   159.00, 'available', true, '{"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80"}', '{bag,backpack,canvas}'),
  ('accessories', 'Arc Desk Lamp', 'arc-desk-lamp',
   'A warm, adjustable LED desk lamp with touch dimming and a weighted brass base.',
   89.00, 'available', true, '{"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80"}', '{lamp,home,lighting}')
) p(category_slug, name, slug, description, price, stock_status, is_active, images, tags)
join categories c on c.slug = p.category_slug
on conflict (slug) do nothing;

insert into banners (image_url, title, subtitle, link_url, sort_order, is_active) values
  ('https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=80',
   'New season, new gear', 'Carefully chosen essentials, priced honestly.',
   '/catalog', 1, true),
  ('https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80',
   'Order in one tap', 'Send your cart straight to us on WhatsApp and we will handle the rest.',
   '/catalog', 2, true)
on conflict do nothing;