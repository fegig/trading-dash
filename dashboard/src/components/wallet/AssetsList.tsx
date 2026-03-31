import { useState } from 'react'
import Modal from '../common/Modal'
import AssetAvatar from '../common/AssetAvatar'
import Receive from './Receive'
import Send from './Send'
import Swap from './Swap'
import { type UserCoinsProps, type WalletDisplayCurrency } from '@/types/wallet'
import { formatCurrency, formatNumber } from '@/util/formatCurrency'
import { formatUsdAndAccountFiat, safeFormatCurrency, usdToAccountFiatAmount } from '@/util/walletDisplay'
import GradientBadge from '../common/GradientBadge'

type Props = {
  userCoins: UserCoinsProps[]
  displayCurrency: WalletDisplayCurrency
}

export default function AssetsList({ userCoins, displayCurrency }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'receive' | 'send' | 'swap' | null>(null)
  const [selectedCoin, setSelectedCoin] = useState<UserCoinsProps | null>(null)

  const handleModalType = (
    type: 'receive' | 'send' | 'swap',
    selected: UserCoinsProps
  ) => {
    setModalType(type)
    setIsModalOpen(true)
    setSelectedCoin(selected)
  }

  const accountCode = displayCurrency.code || 'USD'

  return (
    <>
      {userCoins.map((coin) => {
        const usdPerUnit = Number(coin.price)
        const currentValueUsd = coin.userBalance * usdPerUnit
        const isPositive = Number(coin.change24hrs) >= 0
        const pct = Number(coin.change24hrs)

        const unitPriceLines =
          coin.assetType === 'crypto' ? (
            <div className="text-xs text-neutral-400 space-y-0.5 text-right">
              <div>1 {coin.coinShort} = {formatCurrency(usdPerUnit, 'USD')}</div>
              {accountCode !== 'USD' ? (
                <div className="text-[10px] text-neutral-500">
                  ≈ {safeFormatCurrency(usdToAccountFiatAmount(usdPerUnit, displayCurrency), accountCode)}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-xs text-neutral-400 text-right">
              1 {coin.coinShort} ≈ {formatCurrency(usdPerUnit, 'USD')} USD
            </div>
          )

        const equivLines = formatUsdAndAccountFiat(currentValueUsd, displayCurrency)

        return (
          <div
            className="gradient-background p-4 rounded-lg flex flex-col  space-y-4 min-w-sm max-md:min-w-2xs"
            key={coin.walletId}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AssetAvatar
                  symbol={coin.coinShort}
                  name={coin.coinName}
                  assetType={coin.assetType}
                  iconUrl={coin.iconUrl}
                  iconClass={coin.iconClass}
                  sizeClassName="w-8 h-8"
                />
                <div className="flex flex-col">
                  <div className="text-sm font-bold ">{coin.coinName}</div>
                  <div className="rounded-full hover:bg-neutral-800/50 smooth flex items-center space-x-2 text-xs">
                    {coin.coinChain}
                  </div>
                </div>
              </div>

              <GradientBadge tone={coin.assetType === 'fiat' ? 'green' : 'sky'} size="xs">
                {coin.assetType === 'fiat' ? 'Funding asset' : 'Portfolio asset'}
              </GradientBadge>
            </div>
            <div className="flex items-start space-x-2 justify-between gap-2">
              <div className="md:text-xl text-base font-bold">
                {coin.assetType === 'fiat'
                  ? safeFormatCurrency(coin.userBalance, coin.coinShort || accountCode)
                  : `${formatNumber(coin.userBalance, 4)} ${coin.coinShort}`}
              </div>
              {unitPriceLines}
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-neutral-400">Equivalent</span>
                <div className="text-sm font-bold text-green-500 truncate">
                  {equivLines.fiat}
                </div>
                <div className="text-[10px] text-neutral-500 truncate">≈ {equivLines.usd} USD</div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-[10px] text-neutral-400">24h change</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {isPositive ? '+' : ''}
                    {pct.toFixed(2)}%
                  </span>
                  <i
                    className={`fi fi-rr-arrow-trend-${isPositive ? 'up' : 'down'} ${isPositive ? 'text-green-500' : 'text-red-500'}`}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center gap-2 mt-1">
              {coin.assetType === 'crypto' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleModalType('receive', coin)}
                    className="flex-1 rounded-full gradient-background p-2! py-1! hover:bg-neutral-800/50 flex items-center justify-center space-x-1 text-xs"
                  >
                    <i className="fi fi-rr-arrow-down text-neutral-500" />
                    <span>Receive</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModalType('send', coin)}
                    className="flex-1 rounded-full gradient-background p-2! py-1! hover:bg-neutral-800/50 flex items-center justify-center space-x-1 text-xs"
                  >
                    <i className="fi fi-rr-paper-plane text-neutral-500" />
                    <span>Send</span>
                  </button>
                </>
              ) : (
                <div className="flex-1 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-2 text-center text-xs! text-green-300">
                  Used across the platform
                </div>
              )}

              <button
                type="button"
                onClick={() => handleModalType('swap', coin)}
                className="flex-1 rounded-full gradient-background p-2! py-1! hover:bg-neutral-800/50 flex items-center justify-center space-x-1 text-xs"
              >
                <i className="fi fi-rr-refresh text-neutral-500" />
                <span>{coin.assetType === 'fiat' ? 'Convert' : 'Swap'}</span>
              </button>
            </div>
          </div>
        )
      })}

      {selectedCoin ? (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="">
          {modalType === 'send' ? <Send coin={selectedCoin} /> : null}
          {modalType === 'receive' ? <Receive coin={selectedCoin} /> : null}
          {modalType === 'swap' ? <Swap coin={selectedCoin} /> : null}
        </Modal>
      ) : null}
    </>
  )
}
