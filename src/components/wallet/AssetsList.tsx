import { useState } from 'react'
import Modal from '../common/Modal'
import AssetAvatar from '../common/AssetAvatar'
import Receive from './Receive'
import Send from './Send'
import Swap from './Swap'
import { type UserCoinsProps } from '../../types/wallet'
import { formatCurrency, formatNumber } from '../../util/formatCurrency'
import GradientBadge from '../common/GradientBadge'

export default function AssetsList({ userCoins }: { userCoins: UserCoinsProps[] }) {
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

  return (
    <>
      {userCoins.map((coin) => {
        const currentValue = coin.userBalance * Number(coin.price)
        const isPositive = Number(coin.change24hrs) >= 0

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
                  <div className="rounded-full hover:bg-neutral-800/50 smooth flex items-center space-x-2 text-xs">{coin.coinChain}</div>
                </div>
              </div>

              <GradientBadge tone={coin.assetType === 'fiat' ? 'green' : 'sky'} size="xs">
                {coin.assetType === 'fiat' ? 'Funding Asset' : 'Portfolio Asset'}
              </GradientBadge>

            </div>
            <div className="flex items-center space-x-2 justify-between">
              <div className="md:text-xl text-base font-bold">{coin.assetType === 'fiat'
                ? formatCurrency(coin.userBalance, coin.coinShort)
                : `${formatNumber(coin.userBalance, 4)} ${coin.coinShort}`}</div>
              <div className="text-xs text-neutral-400">1{coin.coinShort} = {formatCurrency(Number(coin.price), 'USD')}</div>
            </div>


            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-400">Equivalent</span>
                <div className="text-sm font-bold text-green-500">{formatCurrency(currentValue, 'USD')}</div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-neutral-400">Today's Change</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(Number(coin.change24hrs), 'USD')}</span>
                  <span className={`text-[10px] ${isPositive ? 'text-green-500' : 'text-red-500'}`}>({formatNumber(Number(coin.change24hrs), 2)}%)</span>
                  <i className={`fi fi-rr-arrow-trend-${isPositive ? 'up' : 'down'} ${isPositive ? 'text-green-500' : 'text-red-500'}`}></i>
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
