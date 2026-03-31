import { Resend } from 'resend'
import type { Env } from '../types/env'

export async function sendEmail(
  env: Env,
  to: string,
  subject: string,
  html: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY missing; email skipped')
    return { ok: false, error: 'Email not configured' }
  }
  const resend = new Resend(env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: env.RESEND_FROM,
    to,
    subject,
    html,
  })
  if (error) {
    console.error('Resend error', error)
    return { ok: false, error: error.message ?? 'Send failed' }
  }
  return { ok: true }
}
