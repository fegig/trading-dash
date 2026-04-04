import { AxiosError, type AxiosResponse } from 'axios'
import { get, post, patch, postForm, remove } from '../util/request'
import { endpoints } from './endpoints'
import { authClient } from './authClient'

// ─── Stats ────────────────────────────────────────────────────────────────────

export type AdminStats = {
  totalUsers: number
  openTrades: number
  totalBots: number
  activeBotSubscriptions: number
}

export async function getAdminStats(): Promise<AdminStats> {
  const data = await get(endpoints.admin.stats)
  return data as AdminStats
}

// ─── Users ────────────────────────────────────────────────────────────────────

export type AdminUserRow = {
  id: string
  email: string
  firstName: string
  lastName: string
  verificationStatus: number
  role: string
  createdAt: string
}

export type AdminUsersResponse = {
  data: AdminUserRow[]
  total: number
  page: number
  limit: number
}

export async function getAdminUsers(params: {
  page?: number
  limit?: number
  search?: string
}): Promise<AdminUsersResponse> {
  const data = await get(endpoints.admin.users, {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    search: params.search ?? undefined,
  })
  return data as AdminUsersResponse
}

export async function getAdminUsersFiatUsdBalances(
  userIds: string[]
): Promise<Record<string, number>> {
  if (userIds.length === 0) return {}
  const data = await get(endpoints.admin.usersFiatUsdBalances, {
    ids: userIds.join(','),
  })
  return (data as { balances?: Record<string, number> })?.balances ?? {}
}

export type AdminUserDetail = {
  user: {
    user_id: string
    email: string
    verificationStatus: string
    role: string
    firstName: string
    lastName: string
    phone: string
    country: string
    currency_code: string
    currency_name: string
  }
  bios: Record<string, unknown>
  assets: AdminUserAsset[]
  trades: AdminTrade[]
  botSubscriptions: AdminBotSub[]
  copyAllocations: AdminCopyAlloc[]
  investments: AdminInvestmentPos[]
}

export type AdminUserAsset = {
  id: number
  coinId: string
  coinName: string
  coinShort: string
  userBalance: string
  assetType: 'crypto' | 'fiat'
  price: string
  walletId: string
  iconUrl: string | null
  iconClass: string | null
}

export type AdminTrade = {
  tradeId: string
  pair: string
  option: string
  status: string
  entryTime: number
  entryPrice: number
  closingTime: number | null
  closingPrice: number | string
  invested: number
  pnl: number | string
  roi: number | string
}

export type AdminBotSub = {
  id: number
  botId: string
  botName: string
  subscribedAt: number
  expiresAt: number
  lifetimePnlUsd: string
}

export type AdminCopyAlloc = {
  id: number
  traderId: string
  traderName: string
  amount: string
  startedAt: number
  expiresAt: number
  lifetimePnlUsd: string
}

export type AdminInvestmentPos = {
  id: number
  productId: string
  productName: string
  amount: string
  startedAt: number
  apy: string | null
  termDays: number | null
}

export async function getAdminUserDetail(id: string): Promise<AdminUserDetail> {
  const data = await get(endpoints.admin.user(id))
  return data as AdminUserDetail
}

export async function patchAdminUserBios(
  id: string,
  payload: { firstName?: string; lastName?: string; phone?: string; country?: string }
): Promise<void> {
  await patch(endpoints.admin.userBios(id), payload)
}

export async function patchAdminUserVerification(
  id: string,
  verificationStatus: number
): Promise<void> {
  await patch(endpoints.admin.userVerification(id), { verificationStatus })
}

export async function patchAdminUserRole(id: string, role: 'user' | 'admin'): Promise<void> {
  await patch(endpoints.admin.userRole(id), { role })
}

export async function fundUserFiat(
  id: string,
  payload: { amountUsd: number; operation: 'credit' | 'debit'; note?: string }
): Promise<void> {
  await post(endpoints.admin.userFundFiat(id), payload)
}

export type WalletLedgerAdjustPayload = {
  assetId: number
  operation: 'credit' | 'debit'
  amount: number
  note: string
  notifyUser?: boolean
}

export async function adjustUserWalletLedger(
  id: string,
  payload: WalletLedgerAdjustPayload
): Promise<{ ok: boolean; emailSent?: boolean }> {
  const res = await post(endpoints.admin.userWalletAdjust(id), {
    ...payload,
  } as unknown as Record<string, unknown>)
  if (!res || res.status < 200 || res.status >= 300) {
    const msg = (res?.data as { error?: string } | undefined)?.error ?? 'Request failed'
    throw new Error(msg)
  }
  return res.data as { ok: boolean; emailSent?: boolean }
}

export async function fundUserAsset(
  id: string,
  payload: { assetId: number; newBalance: number }
): Promise<void> {
  await post(endpoints.admin.userFundAsset(id), payload)
}

// ─── Trades ───────────────────────────────────────────────────────────────────

export type AdminTradeRow = AdminTrade & { userId: string; userEmail: string }

export type AdminTradesResponse = {
  data: AdminTradeRow[]
  page: number
  limit: number
}

export async function getAdminTrades(params: {
  page?: number
  limit?: number
  userId?: string
  status?: string
}): Promise<AdminTradesResponse> {
  const data = await get(endpoints.admin.trades, {
    page: params.page ?? 1,
    limit: params.limit ?? 50,
    userId: params.userId ?? undefined,
    status: params.status ?? undefined,
  })
  return data as AdminTradesResponse
}

export type CreateTradePayload = {
  userIds: string[]
  outcome: 'win' | 'loss'
  /** Position side; stored like live desk (long=buy, short=sell). */
  direction?: 'long' | 'short'
  assetType: 'crypto' | 'stock' | 'forex' | 'commodity'
  pair: string
  entryPrice: number
  amount: number
  estimatedProfit: number
  leverage?: number
  closingPrice?: number
  takeProfitPrice?: number
  stopLossPrice?: number
  /** Unix seconds — when the position opened (backdating allowed). */
  entryTime?: number
  /** Holding length in seconds; closing = entryTime + durationSeconds. */
  durationSeconds?: number
}

export async function createAdminTrades(
  payload: CreateTradePayload
): Promise<{ ok: boolean; created: number; errors: { userId: string; error: string }[] }> {
  const res = await post(endpoints.admin.createTrade, payload as unknown as Record<string, unknown>)
  return res?.data as { ok: boolean; created: number; errors: { userId: string; error: string }[] }
}

// ─── Bots ─────────────────────────────────────────────────────────────────────

export type AdminBot = {
  id: string
  name: string
  strapline: string
  description: string
  strategy: string
  priceUsd: string
  monthlyTarget: string
  winRate: number
  maxDrawdown: number
  markets: string[]
  cadence: string
  guardrails: string[]
  subscriptionDays: number | null
}

export async function getAdminBots(): Promise<AdminBot[]> {
  const data = await get(endpoints.admin.bots)
  return (data as { data: AdminBot[] }).data
}

export async function createAdminBot(payload: Omit<AdminBot, 'id'> & { id?: string }): Promise<string> {
  const res = await post(endpoints.admin.bots, payload as unknown as Record<string, unknown>)
  return res?.data?.id as string
}

export async function updateAdminBot(id: string, payload: Partial<AdminBot>): Promise<void> {
  await patch(endpoints.admin.bot(id), payload as unknown as Record<string, unknown>)
}

export async function deleteAdminBot(id: string): Promise<void> {
  await remove(endpoints.admin.bot(id))
}

// ─── Copy Traders ─────────────────────────────────────────────────────────────

export type AdminCopyTrader = {
  id: string
  name: string
  handle: string
  specialty: string
  followers: number
  winRate: number
  maxDrawdown: number
  minAllocation: number
  feePct: number
  monthlyReturn: string
  bio: string
  focusPairs: string[]
  capacity: 'Open' | 'Limited'
}

export async function getAdminCopyTraders(): Promise<AdminCopyTrader[]> {
  const data = await get(endpoints.admin.copyTraders)
  return (data as { data: AdminCopyTrader[] }).data
}

export async function createAdminCopyTrader(
  payload: Omit<AdminCopyTrader, 'id'> & { id?: string }
): Promise<string> {
  const res = await post(
    endpoints.admin.copyTraders,
    payload as unknown as Record<string, unknown>
  )
  return res?.data?.id as string
}

export async function updateAdminCopyTrader(
  id: string,
  payload: Partial<AdminCopyTrader>
): Promise<void> {
  await patch(endpoints.admin.copyTrader(id), payload as unknown as Record<string, unknown>)
}

export async function deleteAdminCopyTrader(id: string): Promise<void> {
  await remove(endpoints.admin.copyTrader(id))
}

// ─── Investment Products ──────────────────────────────────────────────────────

export type AdminInvestmentProduct = {
  id: string
  name: string
  subtitle: string
  category: 'Short Term' | 'Long Term' | 'Retirement'
  vehicle: string
  apy: string
  termDays: number
  minAmount: number
  liquidity: string
  distribution: string
  fundedPct: number
  risk: 'Low' | 'Moderate' | 'High'
  focus: string[]
  objective: string
  suitableFor: string
  description: string
}

export async function getAdminInvestments(): Promise<AdminInvestmentProduct[]> {
  const data = await get(endpoints.admin.investments)
  return (data as { data: AdminInvestmentProduct[] }).data
}

export async function createAdminInvestment(
  payload: Omit<AdminInvestmentProduct, 'id'> & { id?: string }
): Promise<string> {
  const res = await post(
    endpoints.admin.investments,
    payload as unknown as Record<string, unknown>
  )
  return res?.data?.id as string
}

export async function updateAdminInvestment(
  id: string,
  payload: Partial<AdminInvestmentProduct>
): Promise<void> {
  await patch(endpoints.admin.investment(id), payload as unknown as Record<string, unknown>)
}

export async function deleteAdminInvestment(id: string): Promise<void> {
  await remove(endpoints.admin.investment(id))
}

// ─── Catalog: coins & fiat ───────────────────────────────────────────────────

export type AdminCatalogCoin = {
  id: string
  name: string
  symbol: string
  chain: string
  confirmLevel: number
  depositAddress: string
  iconUrl: string | null
  isActive: boolean
}

export async function getAdminCatalogCoins(): Promise<AdminCatalogCoin[]> {
  const data = await get(endpoints.admin.catalogCoins)
  return (data as { data?: AdminCatalogCoin[] })?.data ?? []
}

export async function createAdminCatalogCoin(
  payload: Record<string, unknown>
): Promise<{ coinId: string; usersProvisioned: number }> {
  const res = (await post(endpoints.admin.catalogCoins, payload)) as AxiosResponse | undefined
  if (!res || res.status >= 400) {
    const msg = (res?.data as { error?: string })?.error ?? 'Failed to create coin'
    throw new Error(msg)
  }
  const body = res.data as { coinId?: string; usersProvisioned?: number }
  return {
    coinId: String(body.coinId ?? ''),
    usersProvisioned: Number(body.usersProvisioned ?? 0),
  }
}

export async function updateAdminCatalogCoin(
  id: string,
  payload: Record<string, unknown>
): Promise<{ usersProvisioned: number }> {
  const res = (await patch(endpoints.admin.catalogCoin(id), payload)) as AxiosResponse | undefined
  if (!res || res.status >= 400) {
    const msg = (res?.data as { error?: string })?.error ?? 'Failed to update coin'
    throw new Error(msg)
  }
  const body = res.data as { usersProvisioned?: number }
  return { usersProvisioned: Number(body.usersProvisioned ?? 0) }
}

export async function removeAdminCatalogCoin(id: string): Promise<{
  rowsDeleted: number
  creditedUsd: number
  liquidationErrors: string[]
}> {
  const res = (await post(
    endpoints.admin.catalogCoinRemove(id),
    {} as Record<string, unknown>
  )) as AxiosResponse | undefined
  if (!res || res.status >= 400) {
    const msg = (res?.data as { error?: string })?.error ?? 'Failed to remove coin'
    throw new Error(msg)
  }
  const body = res.data as {
    rowsDeleted?: number
    creditedUsd?: number
    liquidationErrors?: string[]
  }
  return {
    rowsDeleted: Number(body.rowsDeleted ?? 0),
    creditedUsd: Number(body.creditedUsd ?? 0),
    liquidationErrors: Array.isArray(body.liquidationErrors) ? body.liquidationErrors : [],
  }
}

export type AdminCatalogFiat = {
  id: number
  name: string
  symbol: string
  code: string
}

export async function getAdminCatalogFiat(): Promise<AdminCatalogFiat[]> {
  const data = await get(endpoints.admin.catalogFiat)
  return (data as { data?: AdminCatalogFiat[] })?.data ?? []
}

export async function createAdminCatalogFiat(
  payload: { name: string; symbol: string; code: string }
): Promise<number | undefined> {
  const res = (await post(
    endpoints.admin.catalogFiat,
    payload as unknown as Record<string, unknown>
  )) as AxiosResponse | undefined
  if (!res || res.status >= 400) {
    const msg = (res?.data as { error?: string })?.error ?? 'Failed to create fiat currency'
    throw new Error(msg)
  }
  const body = res.data as { id?: number }
  return typeof body.id === 'number' ? body.id : undefined
}

export async function updateAdminCatalogFiat(
  id: number,
  payload: Partial<{ name: string; symbol: string; code: string }>
): Promise<void> {
  const res = (await patch(
    endpoints.admin.catalogFiatRow(id),
    payload as Record<string, unknown>
  )) as AxiosResponse | undefined
  if (!res || res.status >= 400) {
    const msg = (res?.data as { error?: string })?.error ?? 'Failed to update fiat currency'
    throw new Error(msg)
  }
}

export async function deleteAdminCatalogFiat(id: number): Promise<void> {
  try {
    await remove(endpoints.admin.catalogFiatRow(id))
  } catch (e) {
    if (e instanceof AxiosError && e.response?.data && typeof e.response.data === 'object') {
      const msg = (e.response.data as { error?: string }).error
      if (msg) throw new Error(msg)
    }
    throw e instanceof Error ? e : new Error('Failed to delete fiat currency')
  }
}

// ─── Settings & branding ───────────────────────────────────────────────────

export type AdminSettingsResponse = {
  siteName: string
  supportEmail: string
  supportPhone: string
  ogTitle: string
  ogDescription: string
  hasSiteLogo: boolean
  hasEmailLogo: boolean
  hasFavicon: boolean
  settingsUpdatedAt: number
}

export async function getAdminSettings(): Promise<AdminSettingsResponse> {
  const data = await get(endpoints.admin.settings)
  return data as AdminSettingsResponse
}

export async function patchAdminSettings(
  payload: Partial<
    Pick<AdminSettingsResponse, 'siteName' | 'supportEmail' | 'supportPhone' | 'ogTitle' | 'ogDescription'>
  >
): Promise<AdminSettingsResponse> {
  const res = await patch(endpoints.admin.settings, payload as Record<string, unknown>)
  if (!res || res.status < 200 || res.status >= 300) {
    const msg = (res?.data as { error?: string })?.error ?? 'Failed to save settings'
    throw new Error(msg)
  }
  return res.data as AdminSettingsResponse
}

export async function patchAdminPassword(payload: {
  currentPassword: string
  newPassword: string
}): Promise<void> {
  const res = await patch(endpoints.admin.adminPassword, payload as Record<string, unknown>)
  if (!res || res.status < 200 || res.status >= 300) {
    const msg = (res?.data as { error?: string })?.error ?? 'Failed to change password'
    throw new Error(msg)
  }
}

export async function uploadAdminSiteLogo(file: File): Promise<void> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await postForm(endpoints.admin.settingsSiteLogo, fd)
  if (!res || res.status < 200 || res.status >= 300) {
    const msg = (res?.data as { error?: string })?.error ?? 'Upload failed'
    throw new Error(msg)
  }
}

export async function uploadAdminEmailLogo(file: File): Promise<void> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await postForm(endpoints.admin.settingsEmailLogo, fd)
  if (!res || res.status < 200 || res.status >= 300) {
    const msg = (res?.data as { error?: string })?.error ?? 'Upload failed'
    throw new Error(msg)
  }
}

export async function uploadAdminFavicon(file: File): Promise<void> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await postForm(endpoints.admin.settingsFavicon, fd)
  if (!res || res.status < 200 || res.status >= 300) {
    const msg = (res?.data as { error?: string })?.error ?? 'Upload failed'
    throw new Error(msg)
  }
}

// ─── Verification queue ─────────────────────────────────────────────────────

export type VerificationQueueRow = {
  publicId: string
  email: string
  documents: {
    id: string
    title: string
    subtitle: string
    status: string
    updatedAt: number
    originalFilename: string | null
    mimeType: string | null
    fileSize: number | null
  }[]
}

export async function getVerificationQueue(): Promise<VerificationQueueRow[]> {
  const data = await get(endpoints.admin.verificationQueue)
  return (data as { data: VerificationQueueRow[] }).data
}

export async function approveVerificationDocument(publicId: string, documentId: string): Promise<void> {
  const res = await post(endpoints.admin.verificationApprove(publicId, documentId), {} as Record<string, unknown>)
  if (!res || res.status < 200 || res.status >= 300) {
    const msg = (res?.data as { error?: string })?.error ?? 'Approve failed'
    throw new Error(msg)
  }
}

export async function rejectVerificationDocument(publicId: string, documentId: string): Promise<void> {
  const res = await post(endpoints.admin.verificationReject(publicId, documentId), {} as Record<string, unknown>)
  if (!res || res.status < 200 || res.status >= 300) {
    const msg = (res?.data as { error?: string })?.error ?? 'Reject failed'
    throw new Error(msg)
  }
}

export async function downloadVerificationDocument(publicId: string, documentId: string): Promise<void> {
  const res = await authClient.get(endpoints.admin.verificationDownload(publicId, documentId), {
    responseType: 'blob',
  })
  const blob = res.data as Blob
  const cd = res.headers['content-disposition'] as string | undefined
  let filename = 'document'
  const m = cd?.match(/filename="?([^";]+)"?/i)
  if (m?.[1]) filename = m[1]
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.click()
  URL.revokeObjectURL(href)
}

// ─── FAQ admin ───────────────────────────────────────────────────────────────

export type AdminFaqCategoryRow = {
  id: number
  name: string
  sortOrder: number
}

export type AdminFaqItemRow = {
  id: number
  categoryId: number
  question: string
  answer: string
  sortOrder: number
}

export async function getAdminFaqCategories(): Promise<AdminFaqCategoryRow[]> {
  const data = await get(endpoints.admin.faqAdminCategories)
  return (data as { data: AdminFaqCategoryRow[] }).data
}

export async function createAdminFaqCategory(payload: {
  name: string
  sortOrder?: number
}): Promise<AdminFaqCategoryRow> {
  const res = await post(endpoints.admin.faqAdminCategories, payload as Record<string, unknown>)
  if (!res || res.status < 200 || res.status >= 300) {
    const msg = (res?.data as { error?: string })?.error ?? 'Failed to create category'
    throw new Error(msg)
  }
  return (res.data as { data: AdminFaqCategoryRow }).data
}

export async function updateAdminFaqCategory(
  id: number,
  payload: Partial<{ name: string; sortOrder: number }>
): Promise<AdminFaqCategoryRow> {
  const res = await patch(endpoints.admin.faqAdminCategory(id), payload as Record<string, unknown>)
  if (!res || res.status < 200 || res.status >= 300) {
    const msg = (res?.data as { error?: string })?.error ?? 'Failed to update category'
    throw new Error(msg)
  }
  return (res.data as { data: AdminFaqCategoryRow }).data
}

export async function deleteAdminFaqCategory(id: number): Promise<void> {
  await remove(endpoints.admin.faqAdminCategory(id))
}

export async function getAdminFaqItems(categoryId: number): Promise<AdminFaqItemRow[]> {
  const data = await get(endpoints.admin.faqAdminItemsList(categoryId))
  return (data as { data: AdminFaqItemRow[] }).data
}

export async function createAdminFaqItem(payload: {
  categoryId: number
  question: string
  answer: string
  sortOrder?: number
}): Promise<AdminFaqItemRow> {
  const res = await post(endpoints.admin.faqAdminItems, payload as Record<string, unknown>)
  if (!res || res.status < 200 || res.status >= 300) {
    const msg = (res?.data as { error?: string })?.error ?? 'Failed to create item'
    throw new Error(msg)
  }
  return (res.data as { data: AdminFaqItemRow }).data
}

export async function updateAdminFaqItem(
  id: number,
  payload: Partial<{ question: string; answer: string; sortOrder: number; categoryId: number }>
): Promise<AdminFaqItemRow> {
  const res = await patch(endpoints.admin.faqAdminItem(id), payload as Record<string, unknown>)
  if (!res || res.status < 200 || res.status >= 300) {
    const msg = (res?.data as { error?: string })?.error ?? 'Failed to update item'
    throw new Error(msg)
  }
  return (res.data as { data: AdminFaqItemRow }).data
}

export async function deleteAdminFaqItem(id: number): Promise<void> {
  await remove(endpoints.admin.faqAdminItem(id))
}
