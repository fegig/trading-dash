import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import AssetAvatar from '../common/AssetAvatar'
import Receive from './Receive'
import { type UserCoinsProps, type WalletDisplayCurrency } from '@/types/wallet'
import { formatCurrency, formatNumber } from '@/util/formatCurrency'
import { postWalletDepositIntent } from '@/services/walletService'
import {
  formatUsdAndAccountFiat,
  parseCryptoAmountFromInput,
  safeFormatCurrency,
  usdToAccountFiatAmount,
} from '@/util/walletDisplay'

type Props = {
  coin: UserCoinsProps
  displayCurrency: WalletDisplayCurrency
  onSuccess?: () => void
}

export default function ReceiveFlow({ coin, displayCurrency, onSuccess }: Props) {
  const [step, setStep] = useState<'amount' | 'address'>('amount')
  const [amount, setAmount] = useState('')
  const [amountMode, setAmountMode] = useState<'native' | 'account'>('native')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const unitUsd = Number(coin.price)
  const accountCode = displayCurrency.code?.trim().toUpperCase() || 'USD'

  const nativeAmount = useMemo(
    () => parseCryptoAmountFromInput(amount, amountMode, unitUsd, displayCurrency),
    [amount, amountMode, unitUsd, displayCurrency]
  )

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value)
      setError(null)
    }
  }

  const handleContinue = async () => {
    const n = nativeAmount
    if (!amount || n == null) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    setError(null)
    const res = await postWalletDepositIntent(coin.walletId, n)
    setLoading(false)

    if (!res.ok) {
      setError(res.message)
      toast.error(res.message)
      return
    }

    if (res.emailWarning) {
      toast.warning(`Request saved. Email notice: ${res.emailWarning}`)
    } else {
      toast.success('Deposit request recorded. You can now use the address below.')
    }
    onSuccess?.()
    setStep('address')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void handleContinue()
  }

  const equiv =
    nativeAmount != null && Number.isFinite(unitUsd) && unitUsd > 0 ? (
      <div className="text-xs text-neutral-400 space-y-0.5">
        <div>
          ≈ {formatCurrency(nativeAmount * unitUsd, 'USD')} USD
          {accountCode !== 'USD' ? (
            <span className="text-neutral-500">
              {' '}
              · {safeFormatCurrency(usdToAccountFiatAmount(nativeAmount * unitUsd, displayCurrency), accountCode)}
            </span>
          ) : null}
        </div>
        {amountMode === 'account' ? (
          <div>
            ≈ {formatNumber(nativeAmount, 8)} {coin.coinShort}
          </div>
        ) : accountCode !== 'USD' ? (
          <div>
            ≈{' '}
            {safeFormatCurrency(
              usdToAccountFiatAmount(nativeAmount * unitUsd, displayCurrency),
              accountCode
            )}{' '}
            {accountCode}
          </div>
        ) : null}
      </div>
    ) : null

  if (step === 'address') {
    return <Receive coin={coin} />
  }

  return (
    <div className="gradient-background p-4 rounded-lg flex flex-col space-y-4 min-w-sm max-md:min-w-2xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <AssetAvatar
            symbol={coin.coinShort}
            name={coin.coinName}
            assetType={coin.assetType}
            iconUrl={coin.iconUrl}
            iconClass={coin.iconClass}
            sizeClassName="w-8 h-8"
          />
          <div className="text-sm font-bold">{coin.coinName}</div>
        </div>
      </div>

      <p className="text-xs text-neutral-400">
        Enter how much you plan to deposit. Choose {coin.coinShort} or your account currency; we show USD and the
        other equivalent.
      </p>

      <div className="flex rounded-lg border border-neutral-700 p-0.5 text-[10px]">
        <button
          type="button"
          onClick={() => {
            setAmountMode('native')
            setError(null)
          }}
          className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
            amountMode === 'native' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {coin.coinShort}
        </button>
        <button
          type="button"
          onClick={() => {
            setAmountMode('account')
            setError(null)
          }}
          className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
            amountMode === 'account' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {accountCode}
        </button>
      </div>

      <div className="space-y-2.5">
        <label className="text-[10px] text-neutral-400">
          Amount {amountMode === 'native' ? `(${coin.coinShort})` : `(${accountCode})`}
        </label>
        <div className="relative">
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            onKeyDown={handleKeyDown}
            placeholder="0.00"
            className="w-full text-xs bg-neutral-800/50 rounded-lg p-3 text-white outline-none"
            aria-label="Deposit amount"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-neutral-400">
            {amountMode === 'native' ? coin.coinShort : accountCode}
          </div>
        </div>
        {amount ? equiv : null}
      </div>

      {error ? (
        <div className="text-red-500 text-xs p-2 bg-red-500/10 rounded-lg flex items-center space-x-2">
          <i className="fi fi-rr-exclamation mr-1" />
          <span>{error}</span>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void handleContinue()}
        disabled={loading}
        className="!rounded-full gradient-background hover:bg-neutral-800/50 text-xs smooth !px-4 !py-2 text-white font-medium flex items-center justify-center space-x-2 mx-auto"
      >
        {loading ? (
          <>
            <i className="fi fi-rr-spinner animate-spin" />
            <span>Please wait…</span>
          </>
        ) : (
          <>
            <i className="fi fi-rr-arrow-right" />
            <span>Continue to deposit address</span>
          </>
        )}
      </button>

      <div className="text-[10px] text-neutral-500 text-center">
        Balance: {formatNumber(coin.userBalance, 4)} {coin.coinShort}
        {Number.isFinite(unitUsd) && unitUsd > 0 ? (
          <span className="block mt-0.5">
            {formatUsdAndAccountFiat(coin.userBalance * unitUsd, displayCurrency).usd} ·{' '}
            {formatUsdAndAccountFiat(coin.userBalance * unitUsd, displayCurrency).fiat}
          </span>
        ) : null}
      </div>
    </div>
  )
}
