interface Env {
  API: Fetcher;
}

/**
 * Same-origin /api/* proxy.
 * Cloudflare Access protects the Pages hostname before this Function runs.
 * The identity header is overwritten here, never accepted from browser input.
 * The API Worker is not internet-routable and is reachable only by this service binding.
 */
export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const email = request.headers.get('Cf-Access-Authenticated-User-Email')
  if (!email) {
    return Response.json({ error: 'authentication_required' }, { status: 401 })
  }

  const headers = new Headers(request.headers)
  headers.set('x-stock-researcher-user', email)
  const forwarded = new Request(request, { headers })
  return env.API.fetch(forwarded)
}
