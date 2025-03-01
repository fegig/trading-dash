import { useCallback } from "react";
import { UserCoinsProps } from "../../types/wallet"
import { formatCurrency } from "../../util/formatCurrency";


function AccountBalance({ userCoins }: { userCoins: UserCoinsProps[] }) {

   
    const calculateTotalBalance = useCallback(() => {
        if (!userCoins || userCoins.length === 0) return 0;

        const total = userCoins.reduce((sum, coin) => {
            const coinValue = coin.userBalance * parseFloat(coin.price);
            return sum + coinValue;
        }, 0);

        return formatCurrency(total, "USD");
    }, [userCoins]);

    const totalBalance = calculateTotalBalance();
    return (
        <div className="gradient-background p-4 rounded-lg flex flex-col  space-y-4 min-w-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                     <i className="fi fi-rr-wallet"></i>
                <div className="text-xs font-bold">Wallet Balance</div>
                </div>
             
                <button className="rounded-full bg-neutral-900 p-2 py-1 hover:bg-neutral-800/50 smooth flex items-center space-x-2 text-xs">
                <i className="fi fi-rr-add text-neutral-500"></i>
                <span>Add</span></button>
               
               
            </div>
            <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold">{totalBalance}</div>
            </div>
            <div className="flex flex-col space-y-2 w-full">
                <div className="flex h-1 w-full rounded-full overflow-hidden">
                    {(() => {
                        const totalValue = userCoins.reduce((sum, coin) =>
                            sum + (coin.userBalance * parseFloat(coin.price)), 0);

                        const coinsWithPercentage = userCoins.map(coin => {
                            const value = coin.userBalance * parseFloat(coin.price);
                            const percentage = (value / totalValue) * 100;
                            return { ...coin, percentage, value };
                        }).sort((a, b) => b.value - a.value);

                        const topCoins = coinsWithPercentage.slice(0, 3);
                        const otherCoins = coinsWithPercentage.slice(3);

                        const othersPercentage = otherCoins.reduce((sum, coin) =>
                            sum + coin.percentage, 0);


                        const sections = [
                            ...topCoins.map((coin) => (
                                <div
                                    key={coin.coinId}
                                    className={`h-full`}
                                    style={{ width: `${coin.percentage}%`, backgroundColor: coin.coinColor }}
                                    aria-label={`${coin.coinShort}: ${coin.percentage.toFixed(1)}%`}
                                />
                            )),
                            othersPercentage > 0 && (
                                <div
                                    key="others"
                                    className={` h-full`}
                                    style={{ width: `${othersPercentage}%`, backgroundColor: "gray" }}
                                    aria-label={`Others: ${othersPercentage.toFixed(1)}%`}
                                />
                            )
                        ];

                        return sections;
                    })()}
                </div>

                <div className="flex w-full text-xs justify-start gap-3 mt-2">
                    {(() => {
                        const totalValue = userCoins.reduce((sum, coin) =>
                            sum + (coin.userBalance * parseFloat(coin.price)), 0);

                        const coinsWithPercentage = userCoins.map(coin => {
                            const value = coin.userBalance * parseFloat(coin.price);
                            const percentage = (value / totalValue) * 100;
                            return { ...coin, percentage, value };
                        }).sort((a, b) => b.value - a.value);

                        const topCoins = coinsWithPercentage.slice(0, 3);
                        const otherCoins = coinsWithPercentage.slice(3);

                        const coinLabels = topCoins.map((coin) => (
                            <div key={coin.coinId} className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: coin.coinColor }}></div>
                                <div className="flex items-center gap-1">
                                    <img src={`https://assets.coincap.io/assets/icons/${coin.coinShort.toLowerCase()}@2x.png`} alt={coin.coinShort} className="w-3 h-3" />
                                    <span className="text-[10px]">{coin.coinShort}</span>
                                    <span className="text-[8px] text-neutral-400">({coin.percentage.toFixed(1)}%)</span>
                                </div>
                            </div>
                        ));

                        if (otherCoins.length > 0) {
                            const othersPercentage = otherCoins.reduce((sum, coin) =>
                                sum + coin.percentage, 0);

                            coinLabels.push(
                                <div key="others" className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                    <span className="text-[10px]">Others</span>
                                    <span className="text-[8px] text-neutral-400">({othersPercentage.toFixed(1)}%)</span>
                                </div>
                            );
                        }

                        return coinLabels;
                    })()}
                </div>
            </div>

            <div className="mt-4 !p-3 gradient-background rounded-xl">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-400">24h Profit/Loss</span>
                        {(() => {
                            const totalValue = userCoins.reduce((sum, coin) =>
                                sum + (coin.userBalance * parseFloat(coin.price)), 0);

                            const totalPreviousValue = userCoins.reduce((sum, coin) => {
                                const changePercentage = parseFloat(coin.change24hrs || "0");
                                const previousPrice = parseFloat(coin.price) / (1 + (changePercentage / 100));
                                return sum + (coin.userBalance * previousPrice);
                            }, 0);

                            const profitLoss = totalValue - totalPreviousValue;
                            const profitLossPercentage = (profitLoss / totalPreviousValue) * 100;

                            const isPositive = profitLoss >= 0;

                            return (
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                        {isPositive ? '+' : ''}{profitLoss.toFixed(2)} USD
                                    </span>
                                    <span className={`text-[10px] ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                        ({isPositive ? '+' : ''}{profitLossPercentage.toFixed(2)}%)
                                    </span>
                                    <i className={`fi ${isPositive ? 'fi-rr-arrow-trend-up text-green-500' : 'fi-rr-arrow-trend-down text-red-500'}`}></i>
                                </div>
                            );
                        })()}
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-neutral-400">Today's Change</span>
                        {(() => {
                            const todayChanges = userCoins.map(coin => {
                                const value = coin.userBalance * parseFloat(coin.price);
                                const changePercentage = parseFloat(coin.change24hrs || "0");
                                const changeValue = value * (changePercentage / 100);
                                return { coinId: coin.coinId, changeValue, changePercentage };
                            });

                            const totalChangeValue = todayChanges.reduce((sum, coin) =>
                                sum + coin.changeValue, 0);

                            const totalValue = userCoins.reduce((sum, coin) =>
                                sum + (coin.userBalance * parseFloat(coin.price)), 0);

                            const totalChangePercentage = (totalChangeValue / (totalValue - totalChangeValue)) * 100;

                            const isPositive = totalChangeValue >= 0;

                            return (
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                        {isPositive ? '+' : ''}{totalChangeValue.toFixed(2)} USD
                                    </span>
                                    <span className={`text-[10px] ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                        ({isPositive ? '+' : ''}{totalChangePercentage.toFixed(2)}%)
                                    </span>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                <div className="mt-3 pt-3 border-t border-neutral-800">
                    <div className="text-xs text-neutral-400 mb-2">Top Movers</div>
                    <div className="flex flex-wrap gap-2 justify-evenly">
                        {(() => {
                            const coinsWithChanges = userCoins
                                .map(coin => ({
                                    ...coin,
                                    changePercentage: parseFloat(coin.change24hrs || "0"),
                                    changeValue: (coin.userBalance * parseFloat(coin.price)) * (parseFloat(coin.change24hrs || "0") / 100)
                                }))
                                .sort((a, b) => Math.abs(b.changePercentage) - Math.abs(a.changePercentage))
                                .slice(0, 3);

                            return coinsWithChanges.map(coin => {
                                const isPositive = coin.changePercentage >= 0;

                                return (
                                    <div key={coin.coinId} className="flex items-center gap-1 gradient-background rounded-lg !px-2 !py-1">
                                        <img
                                            src={`https://assets.coincap.io/assets/icons/${coin.coinShort.toLowerCase()}@2x.png`}
                                            alt={coin.coinShort}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-[10px] text-neutral-500 ">{coin.coinShort}</span>
                                        <span className={`text-[10px] ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                            {isPositive ? '+' : ''}{coin.changePercentage.toFixed(2)}%
                                        </span>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AccountBalance