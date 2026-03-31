
export function emailConfirmationPath(mailTo: string, token: string, userId: string | number): string {
  return `/confirm/${encodeURIComponent(mailTo)}/${encodeURIComponent(token)}/${encodeURIComponent(String(userId))}`
}

export function emailConfirmationUrl(
  frontendOrigin: string,
  mailTo: string,
  token: string,
  userId: string | number
): string {
  const base = frontendOrigin.replace(/\/$/, '')
  return `${base}${emailConfirmationPath(mailTo, token, userId)}`
}
