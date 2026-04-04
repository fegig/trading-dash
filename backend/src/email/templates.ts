import type { Env } from '../types/env'

/** Optional branding for all transactional templates (pass from `emailBrandingFromEnv(env)`). */
export type EmailBranding = {
  /** Shown in header/footer; defaults to "Trading Dash" */
  appName?: string
  /** Public site root, no trailing slash — footer link */
  brandBaseUrl?: string
  /** Absolute URL to logo image (set `EMAIL_LOGO_URL` in env) */
  logoUrl?: string
}

export function emailBrandingFromEnv(env: Env): EmailBranding {
  const brandBaseUrl = env.FRONTEND_URL?.trim().replace(/\/$/, '')
  const logoUrl = env.EMAIL_LOGO_URL?.trim() || undefined
  return { brandBaseUrl, logoUrl }
}

/** Prefer first argument when set (DB branding), else env defaults. */
export function mergeEmailBranding(dbBranding: EmailBranding, envBranding: EmailBranding): EmailBranding {
  return {
    appName: dbBranding.appName ?? envBranding.appName,
    brandBaseUrl: dbBranding.brandBaseUrl ?? envBranding.brandBaseUrl,
    logoUrl: dbBranding.logoUrl ?? envBranding.logoUrl,
  }
}

function wrapTransactionalEmail(innerHtml: string, branding: EmailBranding): string {
  const app = branding.appName?.trim() || 'Trading Dash'
  const year = new Date().getUTCFullYear()
  const base = branding.brandBaseUrl?.replace(/\/$/, '') ?? ''
  const logoUrl = branding.logoUrl?.trim()

  const logoBlock = logoUrl
    ? `<a href="${escapeAttr(base || '#')}" style="text-decoration:none;display:inline-block">
        <img src="${escapeAttr(logoUrl)}" alt="${escapeAttr(app)}" width="160" style="max-width:160px;height:auto;border:0;display:block;margin:0 auto" />
      </a>`
    : ''

  const titleBlock = `<div style="font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.02em;line-height:1.2;margin-top:${logoUrl ? '12px' : '0'}">${escapeHtml(app)}</div>`

  const visitSite =
    base.length > 0
      ? `<p style="margin:0 0 10px">
          <a href="${escapeAttr(base)}" style="color:#4b5563;text-decoration:underline;font-size:13px">${escapeHtml(hostLabel(base))}</a>
        </p>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta http-equiv="x-ua-compatible" content="ie=edge"/>
  <title>${escapeHtml(app)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:28px 28px 20px;text-align:center;background:#fafafa;border-bottom:1px solid #f3f4f6;">
              ${logoBlock}
              ${titleBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:28px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.55;color:#374151;">
              ${innerHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 28px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center;font-family:system-ui,-apple-system,sans-serif;font-size:12px;line-height:1.6;color:#6b7280;">
              ${visitSite}
              <p style="margin:0;color:#4b5563;">© ${year} ${escapeHtml(app)}. All rights reserved.</p>
              <p style="margin:14px 0 0;font-size:11px;color:#9ca3af;max-width:400px;margin-left:auto;margin-right:auto;">
                You are receiving this email because you have an account with ${escapeHtml(app)}. If you did not expect this message, you can ignore it or contact support.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function hostLabel(baseUrl: string): string {
  try {
    return new URL(baseUrl).host
  } catch {
    return baseUrl.replace(/^https?:\/\//, '')
  }
}

export function otpEmailHtml(
  params: { code: string } & EmailBranding
): { subject: string; html: string } {
  const { code, ...branding } = params
  const app = branding.appName ?? 'Trading Dash'
  const inner = `<h1 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111827">Sign-in code</h1>
      <p style="margin:0 0 16px;color:#4b5563">Use this code to continue. It expires shortly.</p>
      <p style="margin:0 0 20px;font-size:28px;letter-spacing:6px;font-weight:700;color:#111827;font-family:ui-monospace,monospace">${escapeHtml(code)}</p>
      <p style="margin:0;font-size:14px;color:#6b7280">If you did not request this, you can ignore this email.</p>`
  return {
    subject: `${app} — your login code`,
    html: wrapTransactionalEmail(inner, branding),
  }
}

export function verificationEmailHtml(
  params: {
    userName?: string
    verifyUrl: string
  } & EmailBranding
): { subject: string; html: string } {
  const { userName, verifyUrl, ...branding } = params
  const app = branding.appName ?? 'Trading Dash'
  const name = userName ? `, ${escapeHtml(userName)}` : ''
  const inner = `<h1 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111827">Verify your email${name}</h1>
      <p style="margin:0 0 20px;color:#4b5563">Confirm your address to activate your account.</p>
      <p style="margin:0 0 20px"><a href="${escapeAttr(verifyUrl)}" style="display:inline-block;padding:12px 22px;background:#16a34a;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600">Verify email</a></p>
      <p style="margin:0;font-size:14px;color:#6b7280">Or paste this link into your browser:<br/><span style="word-break:break-all;color:#374151">${escapeHtml(verifyUrl)}</span></p>`
  return {
    subject: `${app} — verify your email`,
    html: wrapTransactionalEmail(inner, branding),
  }
}

export function passwordResetEmailHtml(
  params: { resetUrl: string } & EmailBranding
): { subject: string; html: string } {
  const { resetUrl, ...branding } = params
  const app = branding.appName ?? 'Trading Dash'
  const inner = `<h1 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111827">Password reset</h1>
      <p style="margin:0 0 20px;color:#4b5563">We received a request to reset your password.</p>
      <p style="margin:0 0 20px"><a href="${escapeAttr(resetUrl)}" style="display:inline-block;padding:12px 22px;background:#0284c7;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600">Reset password</a></p>
      <p style="margin:0;font-size:14px;color:#6b7280">If you did not request this, you can ignore this email.</p>`
  return {
    subject: `${app} — reset your password`,
    html: wrapTransactionalEmail(inner, branding),
  }
}

export function onboardingWelcomeEmailHtml(
  params: {
    dashboardUrl: string
    firstName?: string
  } & EmailBranding
): { subject: string; html: string } {
  const { dashboardUrl, firstName, ...branding } = params
  const app = branding.appName ?? 'BlockTrade'
  const name = firstName?.trim() ? ` ${escapeHtml(firstName.trim())}` : ''
  const inner = `<h1 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111827">Welcome${name}</h1>
      <p style="margin:0 0 20px;color:#4b5563">Your profile and workspace preferences are ready. Sign in anytime to trade, manage your wallet, and explore the platform.</p>
      <p style="margin:0 0 20px"><a href="${escapeAttr(dashboardUrl)}" style="display:inline-block;padding:12px 22px;background:#16a34a;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600">Open your dashboard</a></p>
      <p style="margin:0 0 16px;font-size:14px;color:#6b7280">If the button does not work, copy this link:<br/><span style="word-break:break-all;color:#374151">${escapeHtml(dashboardUrl)}</span></p>
      <p style="margin:0;font-size:14px;color:#6b7280">Thank you for joining ${escapeHtml(app)}.</p>`
  const footerBrand: EmailBranding = { ...branding, appName: branding.appName ?? app }
  return {
    subject: `${app} — you are all set`,
    html: wrapTransactionalEmail(inner, footerBrand),
  }
}

export function adminWalletAdjustmentEmailHtml(
  params: {
    firstName?: string
    operation: 'credit' | 'debit'
    amountNative: string
    assetSymbol: string
    eqUsd: string
    note: string
    balanceAfter: string
    dashboardUrl: string
  } & EmailBranding
): { subject: string; html: string } {
  const {
    firstName,
    operation,
    amountNative,
    assetSymbol,
    eqUsd,
    note,
    balanceAfter,
    dashboardUrl,
    ...branding
  } = params
  const app = branding.appName ?? 'BlockTrade'
  const name = firstName?.trim() ? ` ${escapeHtml(firstName.trim())}` : ''
  const verb = operation === 'credit' ? 'credited to' : 'debited from'
  const subjectOp = operation === 'credit' ? 'Wallet credit' : 'Wallet debit'
  const walletUrl = `${dashboardUrl.replace(/\/$/, '')}/dashboard`
  const inner = `<h1 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111827">Wallet update${name}</h1>
      <p style="margin:0 0 16px;color:#4b5563">An administrator ${verb} your <strong>${escapeHtml(assetSymbol)}</strong> wallet.</p>
      <ul style="margin:0 0 16px;padding-left:20px;color:#4b5563;line-height:1.65">
        <li><strong>Amount:</strong> ${escapeHtml(amountNative)} ${escapeHtml(assetSymbol)} (≈ $${escapeHtml(eqUsd)} USD)</li>
        <li><strong>New balance:</strong> ${escapeHtml(balanceAfter)} ${escapeHtml(assetSymbol)}</li>
      </ul>
      <p style="margin:0 0 20px;padding:14px;background:#f4f4f5;border-radius:8px;font-size:14px;color:#374151"><strong>Note</strong><br/>${escapeHtml(note)}</p>
      <p style="margin:0 0 16px"><a href="${escapeAttr(walletUrl)}" style="display:inline-block;padding:12px 22px;background:#d97706;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600">View dashboard</a></p>
      <p style="margin:0;font-size:14px;color:#6b7280">This change appears in your transaction history. If you did not expect this email, contact support.</p>`
  const footerBrand: EmailBranding = { ...branding, appName: branding.appName ?? app }
  return {
    subject: `${app} — ${subjectOp} (${escapeHtml(assetSymbol)})`,
    html: wrapTransactionalEmail(inner, footerBrand),
  }
}

/** Internal support inbox — new send/receive request. */
export function supportWalletRequestEmailHtml(
  params: {
    kind: 'withdrawal' | 'deposit'
    userEmail: string
    userPublicId: string
    assetSymbol: string
    amountNative: string
    eqUsd: string
    transactionId: string
    destinationAddress?: string
    depositExpiresAt?: number
  } & EmailBranding
): { subject: string; html: string } {
  const {
    kind,
    userEmail,
    userPublicId,
    assetSymbol,
    amountNative,
    eqUsd,
    transactionId,
    destinationAddress,
    depositExpiresAt,
    ...branding
  } = params
  const app = branding.appName ?? 'Trading Dash'
  const label = kind === 'withdrawal' ? 'Withdrawal (send)' : 'Deposit (receive)'
  const destBlock =
    kind === 'withdrawal' && destinationAddress
      ? `<li><strong>Destination:</strong> <span style="word-break:break-all">${escapeHtml(destinationAddress)}</span></li>`
      : ''
  const expBlock =
    kind === 'deposit' && depositExpiresAt != null
      ? `<li><strong>Intent expires (UTC):</strong> ${escapeHtml(new Date(depositExpiresAt * 1000).toISOString())}</li>`
      : ''
  const inner = `<h1 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111827">${escapeHtml(label)}</h1>
      <p style="margin:0 0 16px;color:#4b5563">A user submitted a wallet request. Review it in the admin pending queue.</p>
      <ul style="margin:0 0 16px;padding-left:20px;color:#4b5563;line-height:1.65">
        <li><strong>Transaction ID:</strong> ${escapeHtml(transactionId)}</li>
        <li><strong>User email:</strong> ${escapeHtml(userEmail)}</li>
        <li><strong>User ID:</strong> ${escapeHtml(userPublicId)}</li>
        <li><strong>Asset:</strong> ${escapeHtml(assetSymbol)}</li>
        <li><strong>Amount:</strong> ${escapeHtml(amountNative)} ${escapeHtml(assetSymbol)} (≈ $${escapeHtml(eqUsd)} USD)</li>
        ${destBlock}
        ${expBlock}
      </ul>
      <p style="margin:0;font-size:14px;color:#6b7280">This message was sent by ${escapeHtml(app)}.</p>`
  const footerBrand: EmailBranding = { ...branding, appName: branding.appName ?? app }
  return {
    subject: `${app} — ${label}: ${escapeHtml(assetSymbol)} ${escapeHtml(amountNative)}`,
    html: wrapTransactionalEmail(inner, footerBrand),
  }
}

/** User-facing confirmation after admin approves a pending send or receive. */
export function walletRequestConfirmedEmailHtml(
  params: {
    kind: 'withdrawal' | 'deposit'
    userFirstName?: string
    assetSymbol: string
    amountNative: string
    eqUsd: string
    balanceAfter: string
    dashboardUrl: string
  } & EmailBranding
): { subject: string; html: string } {
  const { userFirstName, kind, assetSymbol, amountNative, eqUsd, balanceAfter, dashboardUrl, ...branding } =
    params
  const app = branding.appName ?? 'Trading Dash'
  const name = userFirstName?.trim() ? ` ${escapeHtml(userFirstName.trim())}` : ''
  const action = kind === 'withdrawal' ? 'Withdrawal completed' : 'Deposit confirmed'
  const walletUrl = `${dashboardUrl.replace(/\/$/, '')}/dashboard/wallet`
  const inner = `<h1 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111827">${escapeHtml(action)}${name}</h1>
      <p style="margin:0 0 16px;color:#4b5563">Your ${kind === 'withdrawal' ? 'send' : 'receive'} request has been processed.</p>
      <ul style="margin:0 0 16px;padding-left:20px;color:#4b5563;line-height:1.65">
        <li><strong>Asset:</strong> ${escapeHtml(assetSymbol)}</li>
        <li><strong>Amount:</strong> ${escapeHtml(amountNative)} ${escapeHtml(assetSymbol)} (≈ $${escapeHtml(eqUsd)} USD)</li>
        <li><strong>Balance after:</strong> ${escapeHtml(balanceAfter)} ${escapeHtml(assetSymbol)}</li>
      </ul>
      <p style="margin:0 0 16px"><a href="${escapeAttr(walletUrl)}" style="display:inline-block;padding:12px 22px;background:#16a34a;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600">Open wallet</a></p>
      <p style="margin:0;font-size:14px;color:#6b7280">If you did not request this, contact support immediately.</p>`
  const footerBrand: EmailBranding = { ...branding, appName: branding.appName ?? app }
  return {
    subject: `${app} — ${action} (${escapeHtml(assetSymbol)})`,
    html: wrapTransactionalEmail(inner, footerBrand),
  }
}

export function loginNotificationEmailHtml(
  params: { device: string; time: string } & EmailBranding
): { subject: string; html: string } {
  const { device, time, ...branding } = params
  const app = branding.appName ?? 'Trading Dash'
  const inner = `<h1 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111827">New sign-in</h1>
      <p style="margin:0 0 16px;color:#4b5563">Your account was used to sign in.</p>
      <ul style="margin:0 0 16px;padding-left:20px;color:#4b5563;line-height:1.65">
        <li><strong>When:</strong> ${escapeHtml(time)}</li>
        <li><strong>Device:</strong> ${escapeHtml(device)}</li>
      </ul>
      <p style="margin:0;font-size:14px;color:#6b7280">If this was not you, change your password immediately.</p>`
  return {
    subject: `${app} — new sign-in`,
    html: wrapTransactionalEmail(inner, branding),
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
