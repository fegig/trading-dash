import type { Hono } from 'hono'
import { and, desc, eq, inArray } from 'drizzle-orm'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import * as schema from '../db/schema'
import { requireAdmin } from '../middleware/admin'
import { sendEmail } from '../email/resend-client'
import { walletRequestConfirmedEmailHtml } from '../email/templates'
import { getTransactionalEmailBranding } from '../lib/email-branding'
import { getUserBiosRow } from '../lib/user-bios'
import {
  WALLET_METHOD_WITHDRAWAL_REQUEST,
  WALLET_METHOD_DEPOSIT_REQUEST,
} from '../lib/wallet-request-constants'
import { walletTransactionsBaseColumns } from '../lib/wallet-transactions-columns'

async function getWalletTransactionById(
  db: AppVariables['db'],
  id: string
): Promise<typeof schema.walletTransactions.$inferSelect | undefined> {
  try {
    const [row] = await db
      .select()
      .from(schema.walletTransactions)
      .where(eq(schema.walletTransactions.id, id))
      .limit(1)
    return row
  } catch (err) {
    console.warn('[admin/wallet/pending confirm] full tx row select failed; retrying base columns.', err)
    const [row] = await db
      .select(walletTransactionsBaseColumns)
      .from(schema.walletTransactions)
      .where(eq(schema.walletTransactions.id, id))
      .limit(1)
    return row as unknown as typeof schema.walletTransactions.$inferSelect
  }
}

export function registerAdminWalletPendingRoutes(
  admin: Hono<{ Bindings: Env; Variables: AppVariables }>
) {
  admin.get('/wallet/pending', requireAdmin, async (c) => {
    const pendingWhere = and(
      eq(schema.walletTransactions.status, 'pending'),
      inArray(schema.walletTransactions.methodName, [
        WALLET_METHOD_WITHDRAWAL_REQUEST,
        WALLET_METHOD_DEPOSIT_REQUEST,
      ])
    )
    const order = desc(schema.walletTransactions.createdAt)

    let rows: Array<{
      tx: typeof schema.walletTransactions.$inferSelect
      userEmail: string
      userPublicId: string
    }>

    try {
      rows = await c.var.db
        .select({
          tx: schema.walletTransactions,
          userEmail: schema.users.email,
          userPublicId: schema.users.publicId,
        })
        .from(schema.walletTransactions)
        .innerJoin(schema.users, eq(schema.walletTransactions.userId, schema.users.id))
        .where(pendingWhere)
        .orderBy(order)
        .limit(200)
    } catch (err) {
      console.warn(
        '[admin/wallet/pending] full tx select failed (apply migration 0012). Retrying with base columns.',
        err
      )
      const flat = await c.var.db
        .select({
          ...walletTransactionsBaseColumns,
          userEmail: schema.users.email,
          userPublicId: schema.users.publicId,
        })
        .from(schema.walletTransactions)
        .innerJoin(schema.users, eq(schema.walletTransactions.userId, schema.users.id))
        .where(pendingWhere)
        .orderBy(order)
        .limit(200)
      rows = flat.map((r) => ({
        tx: r as unknown as typeof schema.walletTransactions.$inferSelect,
        userEmail: r.userEmail,
        userPublicId: r.userPublicId,
      }))
    }

    const data = rows.map(({ tx, userEmail, userPublicId }) => ({
      id: tx.id,
      userPublicId,
      userEmail,
      type: tx.type,
      amount: Number(tx.amount),
      eqAmount: Number(tx.eqAmount),
      status: tx.status,
      createdAt: tx.createdAt,
      methodSymbol: tx.methodSymbol,
      methodName: tx.methodName,
      counterpartyAddress: tx.counterpartyAddress?.trim() || null,
      expiresAt: tx.expiresAt ?? null,
      walletAssetId: tx.walletAssetId ?? null,
    }))

    return c.json({ data })
  })

  admin.post('/wallet/pending/:id/confirm', requireAdmin, async (c) => {
    const id = c.req.param('id')?.trim()
    if (!id) return c.json({ error: 'Invalid id' }, 400)

    const tx = await getWalletTransactionById(c.var.db, id)

    if (!tx) return c.json({ error: 'Not found' }, 404)
    if (tx.status !== 'pending') return c.json({ error: 'Not pending' }, 409)
    if (
      tx.methodName !== WALLET_METHOD_WITHDRAWAL_REQUEST &&
      tx.methodName !== WALLET_METHOD_DEPOSIT_REQUEST
    ) {
      return c.json({ error: 'Not a manual wallet request' }, 400)
    }
    if (tx.walletAssetId == null) return c.json({ error: 'Missing wallet link' }, 400)

    const [asset] = await c.var.db
      .select()
      .from(schema.walletAssets)
      .where(eq(schema.walletAssets.id, tx.walletAssetId))
      .limit(1)

    if (!asset || asset.userId !== tx.userId) return c.json({ error: 'Asset not found' }, 404)

    const amt = Number(tx.amount)
    if (!Number.isFinite(amt) || amt <= 0) return c.json({ error: 'Invalid amount' }, 400)

    if (tx.type === 'withdrawal') {
      const bal = Number(asset.userBalance)
      if (bal + 1e-12 < amt) return c.json({ error: 'Insufficient balance' }, 400)
      const next = (bal - amt).toFixed(8)
      await c.var.db
        .update(schema.walletAssets)
        .set({ userBalance: next })
        .where(eq(schema.walletAssets.id, asset.id))
    } else if (tx.type === 'deposit') {
      const bal = Number(asset.userBalance)
      const next = (bal + amt).toFixed(8)
      await c.var.db
        .update(schema.walletAssets)
        .set({ userBalance: next })
        .where(eq(schema.walletAssets.id, asset.id))
    } else {
      return c.json({ error: 'Unsupported transaction type' }, 400)
    }

    await c.var.db
      .update(schema.walletTransactions)
      .set({ status: 'completed' })
      .where(eq(schema.walletTransactions.id, id))

    const [assetAfter] = await c.var.db
      .select({ userBalance: schema.walletAssets.userBalance })
      .from(schema.walletAssets)
      .where(eq(schema.walletAssets.id, asset.id))
      .limit(1)

    const balanceAfterNum = Number(assetAfter?.userBalance ?? 0)
    const sym = asset.coinShort.trim().toUpperCase()
    const prec = asset.assetType === 'fiat' ? 2 : 8
    const balanceAfter =
      asset.assetType === 'fiat'
        ? balanceAfterNum.toLocaleString('en-US', { maximumFractionDigits: prec })
        : balanceAfterNum.toLocaleString('en-US', { maximumFractionDigits: prec })

    const [u] = await c.var.db
      .select({ email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.id, tx.userId))
      .limit(1)

    let emailSent = false
    if (u?.email) {
      const biosRow = await getUserBiosRow(c.var.db, tx.userId)
      const firstName = biosRow?.firstName?.trim() ? biosRow.firstName : undefined
      const base = (c.env.FRONTEND_URL?.trim() || 'http://localhost:4000').replace(/\/$/, '')
      const branding = await getTransactionalEmailBranding(c.env, c.var.db)
      const kind = tx.type === 'withdrawal' ? 'withdrawal' : 'deposit'
      const amtStr =
        amt.toFixed(8).replace(/\.?0+$/, '') || String(amt)
      const tpl = walletRequestConfirmedEmailHtml({
        kind,
        userFirstName: firstName,
        assetSymbol: sym,
        amountNative: amtStr,
        eqUsd: Number(tx.eqAmount).toFixed(2),
        balanceAfter,
        dashboardUrl: base,
        ...branding,
      })
      const r = await sendEmail(c.env, u.email, tpl.subject, tpl.html)
      emailSent = r.ok
    }

    return c.json({ ok: true, emailSent })
  })
}
