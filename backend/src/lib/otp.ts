import { createHash, randomBytes } from 'node:crypto'

export function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export function randomSessionId(): string {
  return randomBytes(32).toString('hex')
}
