import { useState } from 'react'
import { toast } from 'react-toastify'
import AssetAvatar from '../common/AssetAvatar'
import Receive from './Receive'
import { UserCoinsProps } from '@/types/wallet'
import { formatCurrency, formatNumber } from '@/util/formatCurrency'
import { postWalletDepositIntent } from '@/services/walletService'

type Props = {
  coin: UserCoinsProps
  onSuccess?: () => void
}

export default function ReceiveFlow({ coin, onSuccess }: Props) {
  const [step, setStep] = useState<'amount' | 'address'>('amount')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value)
      setError(null)
    }
  }

  const handleContinue = async () => {
    const n = parseFloat(amount)
    if (!amount || !Number.isFinite(n) || n <= 0) {
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
        Enter how much you plan to deposit. We will notify support and show your deposit address next.
      </p>

      <div className="space-y-2.5">
        <label className="text-[10px] text-neutral-400">Amount</label>
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
            {coin.coinShort}
          </div>
        </div>
        {amount ? (
          <div className="text-xs text-neutral-400">
            Approx. {formatCurrency(parseFloat(amount) * parseFloat(coin.price), 'USD')}
          </div>
        ) : null}
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
      </div>
    </div>
  )
}
