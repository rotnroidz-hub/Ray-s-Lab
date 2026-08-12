import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  // Fails loudly and early. Copy .env.example to .env and fill in real values.
  throw new Error(
    'Supabase is not configured. Copy ".env.example" to ".env" and set ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (a placeholder project can ' +
      'be created for free at supabase.com).',
  )
}

// Only ever the public anon key below. The service_role key must NEVER ship to
// the browser — see Section 8 of the project requirements.
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Sign tokens are only minted client-side for the admin area. The exposed
// client is anonymous (anon key) for the storefront so a fully-read bundle
// still grants zero write access thanks to RLS.
export type { Session } from '@supabase/supabase-js'