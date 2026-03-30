import AssetAvatar from '../common/AssetAvatar'
import { type UserCoinsProps } from '../../types/wallet'
import { formatCurrency } from '../../util/formatCurrency'

function calculateTotalValue(userCoins: UserCoinsProps[]) {
    return userCoins.reduce((sum, coin) => sum + coin.userBalance * Number(coin.price), 0)
}

export default function AccountBalance({ userCoins }: { userCoins: UserCoinsProps[] }) {
    const totalValue = calculateTotalValue(userCoins)
    const fiatAsset = userCoins.find((coin) => coin.assetType === 'fiat')

    const topCoins = [...userCoins]
        .map((coin) => ({
            ...coin,
            value: coin.userBalance * Number(coin.price),
            percentage: totalValue ? ((coin.userBalance * Number(coin.price)) / totalValue) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value)

    const topSlices = topCoins.slice(0, 3)
    const otherSlice = topCoins.slice(3).reduce((sum, coin) => sum + coin.percentage, 0)

    const previousValue = userCoins.reduce((sum, coin) => {
        const changePercentage = Number(coin.change24hrs || '0')
        const previousPrice = Number(coin.price) / (1 + changePercentage / 100)
        return sum + coin.userBalance * previousPrice
    }, 0)

    const profitLoss = totalValue - previousValue
    const profitLossPercentage = previousValue ? (profitLoss / previousValue) * 100 : 0
    const positive = profitLoss >= 0
    const todayChange = totalValue - previousValue
    const todayChangePercentage = previousValue ? (todayChange / previousValue) * 100 : 0
    return (
        <div className="gradient-background rounded-2xl flex flex-col space-y-5 min-w-sm max-md:min-w-xs border border-neutral-800/80">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-neutral-300">
                        <i className="fi fi-rr-wallet text-green-400" />
                        <div className="text-xs font-bold uppercase tracking-[0.16em]">Wallet Balance</div>
                    </div>
                    <div className="text-3xl font-bold text-neutral-100">{formatCurrency(totalValue, 'USD')}</div>
                    <div className="text-xs text-neutral-500">
                        {fiatAsset
                            ? `${formatCurrency(fiatAsset.userBalance, 'USD')} ready for bots, trades, copy trading, and investments.`
                            : 'Funding wallet unavailable.'}
                    </div>
                </div>

                <div className="">
                    <div className="text-[8px] uppercase tracking-[0.16em] text-neutral-500">Funding Wallet</div>
                    <div className="text-lg font-semibold text-neutral-100 mt-2">
                        {fiatAsset ? formatCurrency(fiatAsset.userBalance, 'USD') : 'Unavailable'}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">Cash available for every major platform action.</div>
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
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-400">24h Profit/Loss</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${positive ? 'text-green-500' : 'text-red-500'}`}>{positive ? '+' : ''}{formatCurrency(profitLoss, 'USD')}</span>
                            <span className={`text-[10px] ${positive ? 'text-green-500' : 'text-red-500'}`}>({positive ? '+' : ''}{profitLossPercentage.toFixed(2)}%)</span>
                            <i className={`fi fi-rr-arrow-trend-${positive ? 'up' : 'down'} ${positive ? 'text-green-500' : 'text-red-500'}`}></i>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-neutral-400">Today's Change</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${positive ? 'text-green-500' : 'text-red-500'}`}>{positive ? '+' : ''}{formatCurrency(todayChange, 'USD')}</span>
                            <span className={`text-[10px] ${positive ? 'text-green-500' : 'text-red-500'}`}>({positive ? '+' : ''}{todayChangePercentage.toFixed(2)}%)</span>
                        </div>
                    </div>

                </div>
                <div className="mt-3 pt-3 border-t border-neutral-800">
                    <div className="text-xs text-neutral-400 mb-2">Top Movers</div>
                     <div className="flex items-center gap-3 mt-2">
                        {topCoins[0] ? (
                            <>
                            {topCoins.filter((coin) => coin.coinShort !== 'USD').slice(0, 5).map((coin) => (
                                <div className="flex  gap-1 justify-around" key={coin.coinId}>
                                    <div className="flex items-center gap-1 gradient-background rounded-lg px-2! py-1!">
                                        <img alt={coin.coinShort} className="w-4 h-4" src={coin.iconUrl} />
                                        <span className="text-[10px] text-neutral-500 ">{coin.coinShort}</span>
                                        <span className={`text-[10px] ${Number(coin.change24hrs) > 0 ? 'text-green-500' : 'text-red-500'}`}>{Number(coin.change24hrs) > 0 ? '+' : ''}{Number(coin.change24hrs).toFixed(2)}%</span>
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
