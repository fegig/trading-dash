export function otpEmailHtml(params: { code: string; appName?: string }): { subject: string; html: string } {
  const app = params.appName ?? 'Trading Dash'
  return {
    subject: `${app} — your login code`,
    html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px">Sign-in code</h1>
      <p>Use this code to continue. It expires shortly.</p>
      <p style="font-size:28px;letter-spacing:4px;font-weight:700">${escapeHtml(params.code)}</p>
      <p style="color:#666;font-size:14px">If you did not request this, you can ignore this email.</p>
    </body></html>`,
  }
}

export function verificationEmailHtml(params: {
  userName?: string
  verifyUrl: string
  appName?: string
}): { subject: string; html: string } {
  const app = params.appName ?? 'Trading Dash'
  const name = params.userName ? `, ${escapeHtml(params.userName)}` : ''
  return {
    subject: `${app} — verify your email`,
    html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px">Verify your email${name}</h1>
      <p>Confirm your address to activate your account.</p>
      <p><a href="${escapeAttr(params.verifyUrl)}" style="display:inline-block;padding:12px 20px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px">Verify email</a></p>
      <p style="color:#666;font-size:14px">Or paste this link:<br/><span style="word-break:break-all">${escapeHtml(params.verifyUrl)}</span></p>
    </body></html>`,
  }
}

export function passwordResetEmailHtml(params: { resetUrl: string; appName?: string }): { subject: string; html: string } {
  const app = params.appName ?? 'Trading Dash'
  return {
    subject: `${app} — reset your password`,
    html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px">Password reset</h1>
      <p>We received a request to reset your password.</p>
      <p><a href="${escapeAttr(params.resetUrl)}" style="display:inline-block;padding:12px 20px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:8px">Reset password</a></p>
      <p style="color:#666;font-size:14px">If you did not request this, ignore this email.</p>
    </body></html>`,
  }
}

export function loginNotificationEmailHtml(params: {
  device: string
  time: string
  appName?: string
}): { subject: string; html: string } {
  const app = params.appName ?? 'Trading Dash'
  return {
    subject: `${app} — new sign-in`,
    html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px">New sign-in</h1>
      <p>Your account was used to sign in.</p>
      <ul style="color:#444">
        <li><strong>When:</strong> ${escapeHtml(params.time)}</li>
        <li><strong>Device:</strong> ${escapeHtml(params.device)}</li>
      </ul>
      <p style="color:#666;font-size:14px">If this was not you, change your password immediately.</p>
    </body></html>`,
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, '&#39;')
}
