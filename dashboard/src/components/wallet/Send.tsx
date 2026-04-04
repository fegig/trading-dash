import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import AssetAvatar from '../common/AssetAvatar'
import { type UserCoinsProps, type WalletDisplayCurrency } from '@/types/wallet'
import { formatCurrency, formatNumber } from '@/util/formatCurrency'
import { postWalletSendRequest } from '@/services/walletService'
import {
  formatUsdAndAccountFiat,
  parseCryptoAmountFromInput,
  safeFormatCurrency,
  usdToAccountFiatAmount,
} from '@/util/walletDisplay'

export default function Send({
  coin,
  displayCurrency,
  onSuccess,
}: {
  coin: UserCoinsProps
  displayCurrency: WalletDisplayCurrency
  onSuccess?: () => void
}) {
  const [amount, setAmount] = useState<string>('')
  const [amountMode, setAmountMode] = useState<'native' | 'account'>('native')
  const [address, setAddress] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

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

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value)
    setError(null)
  }

  const handleMaxAmount = () => {
    if (!Number.isFinite(unitUsd) || unitUsd <= 0) {
      setAmount(coin.userBalance.toString())
      setAmountMode('native')
      return
    }
    if (amountMode === 'native') {
      setAmount(coin.userBalance.toString())
      return
    }
    const balanceUsd = coin.userBalance * unitUsd
    const maxFiat = usdToAccountFiatAmount(balanceUsd, displayCurrency)
    setAmount(
      Number.isFinite(maxFiat) && maxFiat > 0
        ? String(Number(maxFiat.toFixed(2)))
        : coin.userBalance.toString()
    )
    setAmountMode('account')
  }

  const handleSend = async () => {
    const n = nativeAmount
    if (!amount || n == null) {
      setError('Please enter a valid amount')
      return
    }

    if (n > coin.userBalance + 1e-10) {
      setError('Insufficient balance')
      return
    }

    if (!address || address.length < 10) {
      setError('Please enter a valid wallet address')
      return
    }

    setIsLoading(true)
    const res = await postWalletSendRequest(coin.walletId, n, address.trim())
    setIsLoading(false)

    if (!res.ok) {
      setError(res.message)
      toast.error(res.message)
      return
    }

    if (res.emailWarning) {
      toast.warning(`Request submitted. Email notice: ${res.emailWarning}`)
    } else {
      toast.success(`Withdrawal request submitted for ${formatNumber(n, 8)} ${coin.coinShort}.`)
    }
    onSuccess?.()
    setAmount('')
    setAddress('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      void handleSend()
    }
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
        <div className="text-xs text-neutral-400 text-right">
          <div>
            Balance: {formatNumber(coin.userBalance, 4)} {coin.coinShort}
          </div>
          {Number.isFinite(unitUsd) && unitUsd > 0 ? (
            <div className="text-[10px] text-neutral-500 mt-0.5">
              {formatUsdAndAccountFiat(coin.userBalance * unitUsd, displayCurrency).usd} ·{' '}
              {formatUsdAndAccountFiat(coin.userBalance * unitUsd, displayCurrency).fiat}
            </div>
          ) : null}
        </div>
      </div>

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

      <div className="space-y-4">
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
              aria-label="Amount to send"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
              <button
                type="button"
                onClick={handleMaxAmount}
                className="text-xs text-green-500 hover:text-green-400 smooth"
                aria-label="Use maximum amount"
                tabIndex={0}
              >
                MAX
              </button>
              <span className="text-xs font-medium">
                {amountMode === 'native' ? coin.coinShort : accountCode}
              </span>
            </div>
          </div>
          {amount ? equiv : null}
        </div>

        <div className="space-y-2.5">
          <label className="text-[10px] text-neutral-400">Recipient Address</label>
          <div className="relative">
            <input
              type="text"
              value={address}
              onChange={handleAddressChange}
              onKeyDown={handleKeyDown}
              placeholder={`Enter ${coin.coinShort} address`}
              className="w-full bg-neutral-800/50 rounded-lg p-2 text-white outline-none text-xs pr-16"
              aria-label="Recipient wallet address"
            />
            <button
              type="button"
              onClick={() =>
                navigator.clipboard.readText().then((text) =>
                  handleAddressChange({
                    target: { value: text },
                  } as React.ChangeEvent<HTMLInputElement>)
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-500 hover:text-green-400 smooth flex items-center space-x-1"
              aria-label="Paste address from clipboard"
              tabIndex={0}
            >
              <i className="fi fi-rr-paste" />
              <span>Paste</span>
            </button>
          </div>
        </div>

        {error ? (
          <div className="text-red-500 text-xs p-2 bg-red-500/10 rounded-lg flex items-center space-x-2">
            <i className="fi fi-rr-exclamation mr-1" />
            <span>{error}</span>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={isLoading}
          className="!rounded-full gradient-background hover:bg-neutral-800/50 text-xs smooth !px-4 !py-2 text-white font-medium flex items-center justify-center space-x-2 mx-auto"
          aria-label="Send transaction"
          tabIndex={0}
        >
          {isLoading ? (
            <>
              <i className="fi fi-rr-spinner animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <i className="fi fi-rr-paper-plane" />
              <span>Send {coin.coinShort}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
