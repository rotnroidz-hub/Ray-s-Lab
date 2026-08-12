import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = {}
for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2]
}
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const terms = ['audio', 'headphones', 'wear', 'watch', 'speaker', 'bracelet', 'xxxqwerty']
for (const s of terms) {
  const q = supabase
    .from('products')
    .select('*, categories(id, name, slug)', { count: 'exact' })
    .eq('is_active', true)
    .or(`name.ilike.%${s}%,description.ilike.%${s}%,tags.cs.{${s}}`)
    .range(0, 11)
  const { data, error, count } = await q
  console.log('---- term:', JSON.stringify(s))
  if (error) console.log('  ERROR', error.code, error.message)
  else console.log('  count=', count, (data ?? []).map((p) => p.name).join(' | '))
}

console.log('---- with OR group syntax (comma form vs list):')
const { data: d2, error: e2, count: c2 } = await supabase
  .from('products')
  .select('id', { count: 'exact' })
  .or('tags.cs.{audio}')
console.log('tags.cs.{audio}:', e2 ? 'ERROR ' + e2.message : 'count=' + c2)