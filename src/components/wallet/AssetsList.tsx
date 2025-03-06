import { UserCoinsProps } from "../../types/wallet"
import { formatCurrency, formatNumber } from "../../util/formatCurrency"

function AssetsList({ userCoins }: { userCoins: UserCoinsProps[] }) {
    return (
        userCoins.map((coin) => (
        <div className="gradient-background p-4 rounded-lg flex flex-col  space-y-4 min-w-sm max-md:min-w-2xs" key={coin.walletId}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img src={`https://assets.coincap.io/assets/icons/${coin.coinShort.toLowerCase()}@2x.png`} alt={coin.coinShort} className="w-4 h-4" />
                    <div className="text-sm font-bold">{coin.coinName}</div>
                </div>

                <span className="rounded-full  p-2 py-1 hover:bg-neutral-800/50 smooth flex items-center space-x-2 text-xs">
                    USD
                </span>


            </div>

            <div className="flex items-center space-x-2 justify-between">
                <div className="md:text-xl text-base font-bold">{formatNumber(coin.userBalance, 4)} {coin.coinShort}</div>
                <div className="text-xs text-neutral-400">1{coin.coinShort} = {formatCurrency(parseFloat(coin.price), "USD")} USD</div>
            </div>
            
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[10px] text-neutral-400">Equivalent</span>
                    {(() => {
                        const changePercentage = parseFloat(coin.change24hrs || "0");
                        const currentValue = coin.userBalance * parseFloat(coin.price);
                        const previousValue = currentValue / (1 + (changePercentage / 100));
                        const changeValue = currentValue - previousValue;
                        const isPositive = changeValue >= 0;
                        return (
                            <div className={`text-sm font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(currentValue, "USD")}</div>
                        );
                    })()}
                </div>
                
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-neutral-400">Today's Change</span>
                    {(() => {
                        const changePercentage = parseFloat(coin.change24hrs || "0");
                        const currentValue = coin.userBalance * parseFloat(coin.price);
                        const previousValue = currentValue / (1 + (changePercentage / 100));
                        const changeValue = currentValue - previousValue;
                        const isPositive = changeValue >= 0;
                        
                        return (
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                    {isPositive ? '+' : ''}{changeValue.toFixed(2)} USD
                                </span>
                                <span className={`text-[10px] ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                    ({isPositive ? '+' : ''}{changePercentage.toFixed(2)}%)
                                </span>
                                <i className={`fi ${isPositive ? 'fi-rr-arrow-trend-up text-green-500' : 'fi-rr-arrow-trend-down text-red-500'}`}></i>
                            </div>
                        );
                    })()}
                </div>
            </div>
            <div className="flex justify-between items-center gap-2 mt-2">
                <button className="flex-1 rounded-full gradient-background !p-2 !py-1 hover:bg-neutral-800/50 smooth flex items-center justify-center space-x-1 text-xs">
                    <i className="fi fi-rr-arrow-down text-neutral-500"></i>
                    <span>Receive</span>
                </button>
                <button className="flex-1 rounded-full gradient-background !p-2 !py-1 hover:bg-neutral-800/50 smooth flex items-center justify-center space-x-1 text-xs">
                    <i className="fi fi-rr-paper-plane text-neutral-500"></i>
                    <span>Send</span>
                </button>
                <button className="flex-1 rounded-full gradient-background !p-2 !py-1 hover:bg-neutral-800/50 smooth flex items-center justify-center space-x-1 text-xs">
                    <i className="fi fi-rr-refresh text-neutral-500"></i>
                    <span>Swap</span>
                </button>
            </div>

                    

        </div>
        ))
    )
}

export default AssetsList