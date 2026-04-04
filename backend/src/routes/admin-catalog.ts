import type { Hono } from 'hono'
import { count, eq } from 'drizzle-orm'
import type { ResultSetHeader } from 'mysql2'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import * as schema from '../db/schema'
import { requireAdmin } from '../middleware/admin'
import { catalogDepositAddress } from '../lib/catalog-deposit-address'
import { coincapIconUrl } from '../lib/coincap'
import { provisionCoinForAllUsers } from '../services/wallet-provisioning'
import { insertGlobalNotice } from '../lib/global-notices'
import { liquidateCoinWalletRows } from '../lib/liquidate-coin-wallets'

export function registerAdminCatalogRoutes(
  admin: Hono<{ Bindings: Env; Variables: AppVariables }>
) {
  // ─── Coins (catalog + wallets for non-admin users) ───────────────────────

  admin.get('/catalog/coins', requireAdmin, async (c) => {
    const rows = await c.var.db.select().from(schema.coins).orderBy(schema.coins.id)
    return c.json({
      data: rows.map((r) => ({
        id: r.id,
        name: r.name,
        symbol: r.symbol,
        chain: r.chain,
        confirmLevel: r.confirmLevel,
        depositAddress: r.depositAddress,
        iconUrl: r.iconUrl,
        isActive: r.isActive,
      })),
    })
  })

  admin.post('/catalog/coins', requireAdmin, async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
    const id = typeof body.id === 'string' ? body.id.trim().toUpperCase() : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const symbol = typeof body.symbol === 'string' ? body.symbol.trim().toUpperCase() : ''
    const chain = typeof body.chain === 'string' ? body.chain.trim() : ''
    if (!id || !name || !symbol || !chain) {
      return c.json({ error: 'id, name, symbol and chain are required' }, 400)
    }
    if (chain.toLowerCase() === 'fiat') {
      return c.json({ error: 'Use fiat catalog for fiat chains' }, 400)
    }

    const depositAddress =
      typeof body.depositAddress === 'string' && body.depositAddress.trim()
        ? body.depositAddress.trim()
        : catalogDepositAddress(symbol)

    await c.var.db
      .insert(schema.coins)
      .values({
        id,
        name,
        symbol,
        chain,
        confirmLevel: typeof body.confirmLevel === 'number' ? body.confirmLevel : 0,
        iconUrl: typeof body.iconUrl === 'string' ? body.iconUrl : null,
        depositAddress,
        isActive: true,
      })
      .onDuplicateKeyUpdate({
        set: {
          name,
          symbol,
          chain,
          isActive: true,
          confirmLevel: typeof body.confirmLevel === 'number' ? body.confirmLevel : 0,
          ...(typeof body.depositAddress === 'string' && body.depositAddress.trim()
            ? { depositAddress: body.depositAddress.trim() }
            : {}),
          ...(typeof body.iconUrl === 'string' ? { iconUrl: body.iconUrl } : {}),
        },
      })

    const provisioned = await provisionCoinForAllUsers(c.var.db, id)

    if (provisioned > 0) {
      await insertGlobalNotice(c.var.db, {
        kind: 'coin_added',
        title: `New supported asset: ${symbol}`,
        body: `${name} (${symbol}) is now available in your wallet. You can deposit and trade when funding is enabled for your account.`,
        meta: { coinId: id, symbol, name },
      })
    }

    return c.json({ ok: true, coinId: id, usersProvisioned: provisioned })
  })

  admin.patch('/catalog/coins/:id', requireAdmin, async (c) => {
    const id = c.req.param('id').trim().toUpperCase()
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
    const [existing] = await c.var.db
      .select()
      .from(schema.coins)
      .where(eq(schema.coins.id, id))
      .limit(1)
    if (!existing) return c.json({ error: 'Coin not found' }, 404)

    const upd: Partial<typeof schema.coins.$inferInsert> = {}
    if (typeof body.name === 'string') upd.name = body.name.trim()
    if (typeof body.symbol === 'string') upd.symbol = body.symbol.trim().toUpperCase()
    if (typeof body.chain === 'string') upd.chain = body.chain.trim()
    if (body.confirmLevel !== undefined) upd.confirmLevel = Number(body.confirmLevel)
    if (typeof body.depositAddress === 'string') upd.depositAddress = body.depositAddress.trim()
    if (body.iconUrl !== undefined) upd.iconUrl = typeof body.iconUrl === 'string' ? body.iconUrl : null
    if (body.isActive === true || body.isActive === false) upd.isActive = Boolean(body.isActive)

    if (Object.keys(upd).length === 0) return c.json({ error: 'Nothing to update' }, 400)

    await c.var.db.update(schema.coins).set(upd).where(eq(schema.coins.id, id))

    let provisioned = 0
    if (upd.isActive === true && existing.isActive === false) {
      provisioned = await provisionCoinForAllUsers(c.var.db, id)
      await insertGlobalNotice(c.var.db, {
        kind: 'coin_added',
        title: `Asset re-enabled: ${existing.symbol}`,
        body: `${existing.name} (${existing.symbol}) is supported again. A wallet line has been added if you did not already have one.`,
        meta: { coinId: id, symbol: existing.symbol },
      })
    }

    return c.json({ ok: true, usersProvisioned: provisioned })
  })

  admin.post('/catalog/coins/:id/remove', requireAdmin, async (c) => {
    const id = c.req.param('id').trim().toUpperCase()
    const [coin] = await c.var.db.select().from(schema.coins).where(eq(schema.coins.id, id)).limit(1)
    if (!coin) return c.json({ error: 'Coin not found' }, 404)
    if (coin.chain.toLowerCase() === 'fiat') {
      return c.json({ error: 'Cannot remove fiat-type catalog rows here' }, 400)
    }

    const liq = await liquidateCoinWalletRows(c.env, c.var.db, id)

    await c.var.db.update(schema.coins).set({ isActive: false }).where(eq(schema.coins.id, id))

    await insertGlobalNotice(c.var.db, {
      kind: 'coin_removed',
      title: `Asset no longer held: ${coin.symbol}`,
      body:
        liq.creditedUsd > 0
          ? `Platform support for ${coin.name} (${coin.symbol}) has ended. Any balance you held was converted to your primary fiat wallet at the best available rate.`
          : `Platform support for ${coin.name} (${coin.symbol}) has ended. Your wallet line for this asset was removed.`,
      meta: {
        coinId: id,
        symbol: coin.symbol,
        creditedUsd: liq.creditedUsd,
        walletsCleared: liq.rowsDeleted,
      },
    })

    return c.json({
      ok: true,
      rowsDeleted: liq.rowsDeleted,
      creditedUsd: liq.creditedUsd,
      liquidationErrors: liq.errors,
    })
  })

  // ─── Fiat currencies ─────────────────────────────────────────────────────

  admin.get('/catalog/fiat', requireAdmin, async (c) => {
    const rows = await c.var.db.select().from(schema.fiatCurrencies).orderBy(schema.fiatCurrencies.id)
    return c.json({ data: rows })
  })

  admin.post('/catalog/fiat', requireAdmin, async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const symbol = typeof body.symbol === 'string' ? body.symbol.trim() : ''
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
    if (!name || !symbol || !code) {
      return c.json({ error: 'name, symbol and code are required' }, 400)
    }
    const ins = await c.var.db.insert(schema.fiatCurrencies).values({ name, symbol, code })
    const header = ins[0] as ResultSetHeader
    const insertId = Number(header.insertId ?? 0)
    return c.json({ ok: true, id: insertId || undefined })
  })

  admin.patch('/catalog/fiat/:id', requireAdmin, async (c) => {
    const id = Number(c.req.param('id'))
    if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400)
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
    const upd: Record<string, unknown> = {}
    if (typeof body.name === 'string') upd.name = body.name.trim()
    if (typeof body.symbol === 'string') upd.symbol = body.symbol.trim()
    if (typeof body.code === 'string') upd.code = body.code.trim().toUpperCase()
    if (Object.keys(upd).length === 0) return c.json({ error: 'Nothing to update' }, 400)
    await c.var.db.update(schema.fiatCurrencies).set(upd).where(eq(schema.fiatCurrencies.id, id))
    return c.json({ ok: true })
  })

  admin.delete('/catalog/fiat/:id', requireAdmin, async (c) => {
    const id = Number(c.req.param('id'))
    if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400)
    const [cnt] = await c.var.db
      .select({ n: count() })
      .from(schema.users)
      .where(eq(schema.users.currencyId, id))
    const n = Number(cnt?.n ?? 0)
    if (n > 0) {
      return c.json({ error: `${n} user(s) use this currency; reassign them before deleting` }, 400)
    }
    await c.var.db.delete(schema.fiatCurrencies).where(eq(schema.fiatCurrencies.id, id))
    return c.json({ ok: true })
  })
}
