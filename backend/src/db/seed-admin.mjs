/**
 * Seed script — inserts a super-admin user into the database.
 *
 * Usage (from the backend/ directory):
 *   node --env-file=.env src/db/seed-admin.mjs
 *
 * Optionally override defaults via env vars:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret123 node --env-file=.env src/db/seed-admin.mjs
 */

import { randomBytes, scrypt } from 'node:crypto'
import { promisify } from 'node:util'
import mysql from 'mysql2/promise'

const scryptAsync = promisify(scrypt)

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@blocktrade.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345!'
const ADMIN_FIRST    = process.env.ADMIN_FIRST    || 'Super'
const ADMIN_LAST     = process.env.ADMIN_LAST     || 'Admin'

// ── Password hashing (matches backend/src/lib/password.ts) ──────────────────

async function hashPassword(plain) {
  const SALT_LEN = 16
  const KEY_LEN  = 64
  const salt     = randomBytes(SALT_LEN)
  const derived  = await scryptAsync(plain, salt, KEY_LEN)
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`
}

// ── UUID v4 ──────────────────────────────────────────────────────────────────

function uuid() {
  const b = randomBytes(16)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = b.toString('hex')
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const db = await mysql.createConnection({
    host    : process.env.MYSQL_HOST     || 'localhost',
    port    : Number(process.env.MYSQL_PORT || 3306),
    user    : process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl     : process.env.MYSQL_HOST && process.env.MYSQL_HOST !== 'localhost'
                ? { rejectUnauthorized: false }
                : undefined,
  })

  try {
    // Check if admin already exists
    const [rows] = await db.execute(
      'SELECT id, role FROM users WHERE email = ? LIMIT 1',
      [ADMIN_EMAIL]
    )

    if (rows.length > 0) {
      const existing = rows[0]
      if (existing.role === 'admin') {
        process.stdout.write(`✓ Admin already exists: ${ADMIN_EMAIL}\n`)
        return
      }
      // Exists but not admin — promote
      await db.execute("UPDATE users SET role = 'admin' WHERE id = ?", [existing.id])
      process.stdout.write(`✓ Promoted existing user to admin: ${ADMIN_EMAIL}\n`)
      return
    }

    const publicId     = uuid()
    const passwordHash = await hashPassword(ADMIN_PASSWORD)

    // Insert user
    const [userResult] = await db.execute(
      `INSERT INTO users (public_id, email, password_hash, currency_id, verification_status, role)
       VALUES (?, ?, ?, 1, 3, 'admin')`,
      [publicId, ADMIN_EMAIL, passwordHash]
    )
    const userId = userResult.insertId

    // Insert bios
    await db.execute(
      `INSERT INTO user_bios (user_id, first_name, last_name, phone, country,
         login_otp_enabled, onboarding_welcome_sent)
       VALUES (?, ?, ?, '', '', false, true)`,
      [userId, ADMIN_FIRST, ADMIN_LAST]
    )

    process.stdout.write(`✓ Super admin created successfully\n`)
    process.stdout.write(`  Email   : ${ADMIN_EMAIL}\n`)
    process.stdout.write(`  Password: ${ADMIN_PASSWORD}\n`)
    process.stdout.write(`  User ID : ${publicId}\n`)
    process.stdout.write(`\n`)
    process.stdout.write(`  ⚠  Change the password after first login.\n`)
  } finally {
    await db.end()
  }
}

main().catch((err) => {
  process.stderr.write(`✗ Seed failed: ${err.message}\n`)
  process.exit(1)
})
