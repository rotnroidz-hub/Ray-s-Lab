import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = {}
for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2]
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

for (const table of ['categories', 'brands', 'products', 'banners']) {
  const { data, error } = await supabase.from(table).select('*').limit(50)
  if (error) console.log(table, 'ERROR', error.code, error.message)
  else console.log(table, 'OK rows=', Array.isArray(data) ? data.length : 0)
}

const { data: p, error: pe } = await supabase.from('products').select('*').eq('is_active', true).limit(3)
console.log('active products', pe ? `ERROR ${pe.message}` : JSON.stringify((p ?? []).map((x) => ({ name: x.name, price: x.price, images: (x.images ?? []).length })), null, 2))
