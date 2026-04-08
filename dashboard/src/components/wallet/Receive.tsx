import { useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import AssetAvatar from '../common/AssetAvatar'
import { UserCoinsProps, WalletDisplayCurrency } from '@/types/wallet'
import { downloadQRCode } from '@/util/qr'
import { formatCurrency, formatNumber } from '@/util/formatCurrency'
import { safeFormatCurrency, usdToAccountFiatAmount } from '@/util/walletDisplay'

/** BIP-21 / EIP-681 scheme per coin symbol. */
const COIN_SCHEMES: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  LTC: 'litecoin',
  BCH: 'bitcoincash',
  XRP: 'xrp',
  DOGE: 'dogecoin',
  SOL: 'solana',
  BNB: 'bnb',
  ADA: 'cardano',
  DOT: 'polkadot',
  MATIC: 'polygon',
  USDT: 'ethereum',
  USDC: 'ethereum',
  ATOM: 'cosmos',
  TRX: 'tron',
  AVAX: 'avax',
}

function buildQrValue(coin: UserCoinsProps, nativeAmount?: number): string {
  const scheme = COIN_SCHEMES[coin.coinShort.toUpperCase()] ?? coin.coinShort.toLowerCase()
  if (nativeAmount && nativeAmount > 0) {
    return `${scheme}:${coin.walletAddress}?amount=${nativeAmount.toFixed(8)}`
  }
  return coin.walletAddress
}

type Props = {
  coin: UserCoinsProps
  nativeAmount?: number
  displayCurrency?: WalletDisplayCurrency
  unitUsd?: number
}

export default function Receive({ coin, nativeAmount, displayCurrency, unitUsd }: Props) {
  const [copied, setCopied] = useState<boolean>(false)
  const qrCodeRef = useRef<SVGSVGElement>(null)

  const accountCode = displayCurrency?.code?.trim().toUpperCase() || 'USD'
  const usdValue = nativeAmount && unitUsd ? nativeAmount * unitUsd : null
  const qrValue = buildQrValue(coin, nativeAmount)

  const handleCopyAddress = () => {
    void navigator.clipboard.writeText(coin.walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCopyAddress()
  }

  const handleDownloadQR = () => {
    downloadQRCode(qrCodeRef.current, `${coin.coinShort}_QR_Code.png`)
  }

  const handleDownloadKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleDownloadQR()
  }

  return (
    <div className="gradient-background p-4 rounded-lg flex flex-col space-y-4 min-w-sm max-md:min-w-2xs">
      <div className="flex items-center space-x-2 mb-2">
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

      {/* Transaction summary */}
      {nativeAmount && nativeAmount > 0 ? (
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 space-y-2.5">
          <div className="text-xs font-semibold text-green-300 flex items-center gap-2">
            <i className="fi fi-rr-receipt" />
            Deposit Summary
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">You will receive</span>
              <span className="font-semibold text-white">
                {formatNumber(nativeAmount, 8)} {coin.coinShort}
              </span>
            </div>
            {usdValue != null && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">≈ USD value</span>
                <span className="text-neutral-200">{formatCurrency(usdValue, 'USD')}</span>
              </div>
            )}
            {usdValue != null && displayCurrency && accountCode !== 'USD' && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">≈ {accountCode}</span>
                <span className="text-neutral-200">
                  {safeFormatCurrency(usdToAccountFiatAmount(usdValue, displayCurrency), accountCode)}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Warning */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5">
        <i className="fi fi-rr-triangle-warning text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-200 leading-relaxed">
          <span className="font-semibold">Send only {coin.coinShort} to this address.</span>{' '}
          Sending any other cryptocurrency to this address will result in permanent, unrecoverable
          loss of funds.
        </p>
      </div>

      {/* QR code — encodes BIP-21 URI when amount is set, making it scannable by wallet apps */}
      <div className="flex flex-col items-center space-y-3 py-2">
        <div className="bg-white p-3 rounded-xl shadow-lg">
          <QRCodeSVG
            value={qrValue}
            size={180}
            level="M"
            className="w-44 h-44"
            ref={qrCodeRef}
          />
        </div>
        {nativeAmount && nativeAmount > 0 ? (
          <p className="text-[10px] text-neutral-500 text-center max-w-xs">
            Scan with any {coin.coinShort} wallet to auto-fill address
            {unitUsd ? ` and amount` : ''}
          </p>
        ) : null}
      </div>

      {/* Address field */}
      <div className="space-y-2 w-full">
        <label className="text-xs text-neutral-400">Your {coin.coinShort} Address</label>
        <div className="relative">
          <input
            type="text"
            value={coin.walletAddress}
            readOnly
            className="w-full bg-neutral-800/50 rounded-lg p-3 pr-12 text-white outline-none text-xs overflow-ellipsis"
            aria-label={`Your ${coin.coinShort} wallet address`}
          />
          <button
            onClick={handleCopyAddress}
            onKeyDown={handleKeyDown}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-green-500 hover:text-green-400 smooth text-xs bg-neutral-800 rounded-lg p-2"
            aria-label="Copy address to clipboard"
            tabIndex={0}
          >
            {copied ? (
              <i className="fi fi-rr-check text-green-500" />
            ) : (
              <i className="fi fi-rr-copy" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-4">
        <button
          className="rounded-full bg-neutral-800 hover:bg-neutral-700 smooth px-4 py-2 text-white text-xs flex items-center space-x-2"
          aria-label="Share address"
          tabIndex={0}
        >
          <i className="fi fi-rr-share" />
          <span>Share</span>
        </button>
        <button
          className="rounded-full gradient-background hover:bg-neutral-800/50 smooth px-4! py-2! text-white text-xs flex items-center space-x-2"
          aria-label="Download QR code"
          tabIndex={0}
          onClick={handleDownloadQR}
          onKeyDown={handleDownloadKeyDown}
        >
          <i className="fi fi-rr-download" />
          <span>Download</span>
        </button>
      </div>
    </div>
  )
}
