import { z } from 'zod'

export const userIdSchema = z.union([z.string(), z.number()])

export const loginBodySchema = z.object({
  useremail: z.string().email(),
  password: z.string().min(1),
})

export const userIdBodySchema = z.object({
  userId: userIdSchema,
})

export const closeTradeBodySchema = z.object({
  tradeID: z.string(),
  /** Optional exit mark; defaults to stored market price on the trade row. */
  marketPrice: z.number().positive().optional(),
})

export const walletConvertBodySchema = z.object({
  fromWalletId: z.string().min(1),
  toWalletId: z.string().min(1),
  fromAmount: z.number().positive(),
})

export const walletSendRequestBodySchema = z.object({
  walletId: z.string().min(1),
  amount: z.number().positive(),
  destinationAddress: z.string().min(10).max(512),
})

export const walletDepositIntentBodySchema = z.object({
  walletId: z.string().min(1),
  amount: z.number().positive(),
})

export const currencyIdBodySchema = z.object({
  currencyId: z.union([z.string(), z.number()]),
})

export const sendOTPBodySchema = z.object({
  userId: userIdSchema,
  messageId: z.string(),
  code: z.string(),
  time: z.number(),
  expires: z.number(),
})

export const verifyOTPBodySchema = z.object({
  userId: userIdSchema,
  messageId: z.string(),
  code: z.string(),
})

export const registerBodySchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  refBy: z.string().nullable(),
  password: z.string().optional(),
})

export const passwordResetBodySchema = z.object({
  email: z.string().email(),
})

export const createTokenBodySchema = z
  .object({
    userId: z.union([z.string(), z.number()]).optional(),
    token: z.string(),
    time: z.number().optional(),
    expires: z.number().optional(),
    status: z.string().optional(),
  })
  .passthrough()

export const verifyTokenBodySchema = z.object({
  token: z.string(),
  userId: z.string(),
})

export const updateUserStatusBodySchema = z.object({
  status: z.number(),
  userId: z.union([z.string(), z.number()]),
})

export const getVerificationStatusBodySchema = z.object({
  userId: z.union([z.number(), z.string()]),
})

/** Session user only; do not send internal DB id or publicId (they were easy to mix up). */
export const updateCurrencyBodySchema = z.object({
  country: z.string(),
  currency_id: z.number(),
})

export const addAdminWalletBodySchema = z.object({}).passthrough()

export const affiliateSummaryBodySchema = z.object({
  userId: z.string(),
})

export const placeLiveOrderBodySchema = z.object({
  pair: z.string(),
  side: z.enum(['buy', 'sell']),
  type: z.enum(['market', 'limit', 'stop']),
  amount: z.number().positive(),
  leverage: z.number().min(1).default(1),
  price: z.number().optional(),
  marginType: z.enum(['isolated', 'cross']).default('isolated'),
  takeProfitPrice: z.number().positive().optional(),
  stopLossPrice: z.number().positive().optional(),
})

export const cancelLiveOrderBodySchema = z.object({
  orderId: z.string(),
  pair: z.string(),
})

export const sendVerificationEmailBodySchema = z.object({
  mailTo: z.string().email(),
  userId: userIdSchema,
  /** Ignored — server generates the verification token. */
  token: z.string().optional(),
  userName: z.string().optional(),
})

export const verificationPollBodySchema = z.object({
  userId: userIdSchema,
  email: z.string().email(),
})

export const sendLoginOtpEmailBodySchema = z.object({
  mailTo: z.string().email(),
  otpCode: z.string(),
})

export const loginNotificationBodySchema = z.object({
  userMail: z.string().email(),
  userId: userIdSchema,
  device: z.string(),
  time: z.string(),
})
