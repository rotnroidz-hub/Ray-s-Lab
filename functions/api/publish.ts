// Cloudflare Pages Function: POST /api/publish → fire the deploy hook so a
// rebuild regenerates the build-time artifacts (sitemap.xml, prerendered
// per-route meta) that Supabase edits do not touch.
//
// DEPLOY_HOOK_URL is deliberately NOT a VITE_ variable: vite only inlines
// import.meta.env.VITE_* referenced from client code, and this file never
// enters the client bundle at all — the hook URL exists only in the Pages
// environment and in this worker.
//
// Auth reuses the app's existing scheme: the caller passes its Supabase
// session JWT as a Bearer token, and we verify it by invoking rpc/is_admin —
// the very function public.is_admin() / the RLS write policies use — as the
// caller. EXECUTE on is_admin() is revoked from anon, so a bare anon key can
// never pass.

type Env = {
  DEPLOY_HOOK_URL?: string
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_ANON_KEY?: string
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
}

type PublishContext = {
  request: Request
  env: Env
}

function json(status: number, body: unknown, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...extraHeaders },
  })
}

export async function onRequestPost({ request, env }: PublishContext): Promise<Response> {
  const header = request.headers.get('Authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) {
    return json(401, { error: 'Missing Authorization bearer token' })
  }

  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    return json(500, { error: 'Supabase is not configured on the server' })
  }

  // Server-side admin check via the app's own predicate (see header comment).
  let isAdmin = false
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/is_admin`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: '{}',
    })
    if (!res.ok) {
      return json(401, { error: 'Invalid or expired session' })
    }
    isAdmin = (await res.json()) === true
  } catch {
    return json(502, { error: 'Could not verify the admin session' })
  }
  if (!isAdmin) {
    return json(403, { error: 'Admin session required' })
  }

  const hookUrl = env.DEPLOY_HOOK_URL
  if (!hookUrl) {
    return json(500, { error: 'DEPLOY_HOOK_URL is not configured' })
  }

  let hook: Response
  try {
    hook = await fetch(hookUrl, { method: 'POST' })
  } catch {
    return json(502, { error: 'Deploy hook is unreachable' })
  }

  // Pass the hook's own status through so the UI can report success/failure.
  return json(hook.status, { ok: hook.ok, status: hook.status })
}

export async function onRequestGet(): Promise<Response> {
  return json(405, { error: 'POST required' }, { allow: 'POST' })
}
