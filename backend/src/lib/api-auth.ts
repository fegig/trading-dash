import type { Env } from '../types/env'
import type { SessionUser } from '../services/user-context'

type MinimalCtx = {
  env: Env
  var: { user: SessionUser | null }
  req: { header: (name: string) => string | undefined }
  json: (body: unknown, status?: number) => Response
}

export function trustedApiKey(c: MinimalCtx): boolean {
  const k = c.env.API_KEY
  if (!k) return false
  return c.req.header('x-api-key') === k
}

export function assertUserScope(
  c: MinimalCtx,
  bodyUserId: string | number | undefined
): { ok: true } | { ok: false; res: Response } {
  if (trustedApiKey(c)) return { ok: true }
  if (!c.var.user) {
    return { ok: false, res: c.json({ error: 'Unauthorized' }, 401) }
  }
  if (bodyUserId == null || String(bodyUserId) !== c.var.user.publicId) {
    return { ok: false, res: c.json({ error: 'Forbidden' }, 403) }
  }
  return { ok: true }
}
