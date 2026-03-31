import AssetAvatar from '../common/AssetAvatar'
import { type UserCoinsProps, type WalletDisplayCurrency } from '@/types/wallet'
import { formatCurrency } from '@/util/formatCurrency'
import { formatUsdAndAccountFiat, safeFormatCurrency, usdToAccountFiatAmount } from '@/util/walletDisplay'

function calculateTotalUsd(userCoins: UserCoinsProps[]) {
  return userCoins.reduce((sum, coin) => sum + coin.userBalance * Number(coin.price), 0)
}

type Props = {
  userCoins: UserCoinsProps[]
  displayCurrency: WalletDisplayCurrency
}

export default function AccountBalance({ userCoins, displayCurrency }: Props) {
  const totalUsd = calculateTotalUsd(userCoins)
  const totalAccountFiat = usdToAccountFiatAmount(totalUsd, displayCurrency)
  const fiatAsset = userCoins.find((coin) => coin.assetType === 'fiat')
  const accountCode = displayCurrency.code || 'USD'

  const topCoins = [...userCoins]
    .map((coin) => ({
      ...coin,
      valueUsd: coin.userBalance * Number(coin.price),
      percentage: totalUsd ? ((coin.userBalance * Number(coin.price)) / totalUsd) * 100 : 0,
    }))
    .sort((a, b) => b.valueUsd - a.valueUsd)

  const topSlices = topCoins.slice(0, 3)
  const otherSlice = topCoins.slice(3).reduce((sum, coin) => sum + coin.percentage, 0)

  const previousUsd = userCoins.reduce((sum, coin) => {
    const changePercentage = Number(coin.change24hrs || '0')
    const previousPrice = Number(coin.price) / (1 + changePercentage / 100)
    return sum + coin.userBalance * previousPrice
  }, 0)

  const profitLossUsd = totalUsd - previousUsd
  const profitLossAccount = usdToAccountFiatAmount(profitLossUsd, displayCurrency)
  const profitLossPercentage = previousUsd ? (profitLossUsd / previousUsd) * 100 : 0
  const positive = profitLossUsd >= 0

  const fiatBalanceUsd =
    fiatAsset != null ? fiatAsset.userBalance * Number(fiatAsset.price) : 0
  const fiatEquiv = formatUsdAndAccountFiat(fiatBalanceUsd, displayCurrency)

  return (
    <div className="gradient-background rounded-2xl flex flex-col space-y-5 min-w-sm max-md:min-w-xs border border-neutral-800/80">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center space-x-2 text-neutral-300">
            <i className="fi fi-rr-wallet text-green-400" />
            <div className="text-xs font-bold uppercase tracking-[0.16em]">Wallet balance</div>
          </div>
          <div className="text-3xl font-bold text-neutral-100 truncate">
            {safeFormatCurrency(totalAccountFiat, accountCode)}
          </div>
          <div className="text-xs text-neutral-500">
            ≈ {formatCurrency(totalUsd, 'USD')} USD · used for trades, bots, copy trading &amp; investments
          </div>
        </div>

        <div className="">
          <div className="text-[8px] uppercase tracking-[0.16em] text-neutral-500">Funding wallet</div>
          <div className="text-lg font-semibold text-neutral-100 mt-2">
            {fiatAsset
              ? safeFormatCurrency(fiatAsset.userBalance, fiatAsset.coinShort || accountCode)
              : 'Unavailable'}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {fiatAsset ? (
              <>
                ≈ {fiatEquiv.usd} USD — cash available for platform actions
              </>
            ) : (
              'Cash unavailable.'
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex h-2 w-full rounded-full overflow-hidden bg-neutral-950/70">
          {topSlices.map((coin) => (
            <div
              key={coin.coinId}
              className="h-full"
              style={{ width: `${coin.percentage}%`, backgroundColor: coin.coinColor }}
            />
          ))}
          {otherSlice > 0 ? (
            <div className="h-full bg-neutral-600" style={{ width: `${otherSlice}%` }} />
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3 text-xs">
          {topSlices.map((coin) => (
            <div key={coin.coinId} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: coin.coinColor }} />
              <AssetAvatar
                symbol={coin.coinShort}
                name={coin.coinName}
                assetType={coin.assetType}
                iconUrl={coin.iconUrl}
                iconClass={coin.iconClass}
                sizeClassName="w-5 h-5"
                textClassName="text-[10px]"
              />
              <span className="text-neutral-300">{coin.coinShort}</span>
              <span className="text-neutral-500">({coin.percentage.toFixed(1)}%)</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 p-3! gradient-background rounded-xl">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400">24h profit / loss</span>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-semibold ${positive ? 'text-green-500' : 'text-red-500'}`}
              >
                {positive ? '+' : ''}
                {safeFormatCurrency(profitLossAccount, accountCode)}
              </span>
              <span className={`text-[10px] ${positive ? 'text-green-500' : 'text-red-500'}`}>
                ({positive ? '+' : ''}
                {profitLossPercentage.toFixed(2)}%)
              </span>
              <span className="text-[10px] text-neutral-500">
                {positive ? '+' : ''}
                {formatCurrency(profitLossUsd, 'USD')} USD
              </span>
              <i
                className={`fi fi-rr-arrow-trend-${positive ? 'up' : 'down'} ${positive ? 'text-green-500' : 'text-red-500'}`}
              />
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-neutral-400">Today vs yesterday</span>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold ${positive ? 'text-green-500' : 'text-red-500'}`}
              >
                {positive ? '+' : ''}
                {formatCurrency(profitLossUsd, 'USD')}
              </span>
              <span className={`text-[10px] ${positive ? 'text-green-500' : 'text-red-500'}`}>
                ({positive ? '+' : ''}
                {profitLossPercentage.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-neutral-800">
          <div className="text-xs text-neutral-400 mb-2">Top movers</div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {topCoins[0] ? (
              <>
                {topCoins
                  .filter((coin) => coin.assetType === 'crypto')
                  .slice(0, 5)
                  .map((coin) => (
                    <div className="flex gap-1 justify-around" key={coin.coinId}>
                      <div className="flex items-center gap-1 gradient-background rounded-lg px-2! py-1!">
                        <AssetAvatar
                          symbol={coin.coinShort}
                          name={coin.coinName}
                          assetType={coin.assetType}
                          iconUrl={coin.iconUrl}
                          iconClass={coin.iconClass}
                          sizeClassName="w-4 h-4"
                          textClassName="text-[8px]"
                        />
                        <span className="text-[10px] text-neutral-500">{coin.coinShort}</span>
                        <span
                          className={`text-[10px] ${Number(coin.change24hrs) > 0 ? 'text-green-500' : 'text-red-500'}`}
                        >
                          {Number(coin.change24hrs) > 0 ? '+' : ''}
                          {Number(coin.change24hrs).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </>
            ) : (
              <span className="text-sm text-neutral-500">No assets</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
