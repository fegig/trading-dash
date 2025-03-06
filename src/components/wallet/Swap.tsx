import { useState, useEffect } from "react";
import { UserCoinsProps } from "../../types/wallet";
import { formatCurrency, formatNumber } from "../../util/formatCurrency";

function Swap({ coin }: { coin: UserCoinsProps }) {
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [toCoin, setToCoin] = useState<string>("BTC");
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sample available coins - in a real app, this would come from your API
  const availableCoins = ["BTC", "ETH", "SOL", "USDT", "USDC"];
  const filteredCoins = availableCoins.filter(c => c !== coin.coinShort);

  useEffect(() => {
    // Simulate fetching exchange rate
    const fetchExchangeRate = async () => {
      // In a real app, you would fetch the actual exchange rate from an API
      // For demo purposes, we'll use a random rate
      const mockRate = Math.random() * 10;
      setExchangeRate(mockRate);
    };

    if (toCoin) {
      fetchExchangeRate();
    }
  }, [toCoin, coin.coinShort]);

  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (/^\d*\.?\d*$/.test(value)) {
      setFromAmount(value);
      // Calculate to amount based on exchange rate
      if (value && exchangeRate) {
        setToAmount((parseFloat(value) * exchangeRate).toFixed(8));
      } else {
        setToAmount("");
      }
      setError(null);
    }
  };

  const handleToAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (/^\d*\.?\d*$/.test(value)) {
      setToAmount(value);
      // Calculate from amount based on exchange rate
      if (value && exchangeRate) {
        setFromAmount((parseFloat(value) / exchangeRate).toFixed(8));
      } else {
        setFromAmount("");
      }
      setError(null);
    }
  };

  const handleMaxAmount = () => {
    setFromAmount(coin.userBalance.toString());
    if (exchangeRate) {
      setToAmount((coin.userBalance * exchangeRate).toFixed(8));
    }
  };

  const handleSwapCoins = () => {
    // In a real app, you would need to update the coin object and exchange rates
    alert("Coin swap functionality would be implemented here");
  };

  const handleSwap = () => {
    // Validate inputs
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (parseFloat(fromAmount) > coin.userBalance) {
      setError("Insufficient balance");
      return;
    }

    // Simulate swapping
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Here you would integrate with your actual swapping logic
      alert(`Successfully swapped ${fromAmount} ${coin.coinShort} for ${toAmount} ${toCoin}`);
    }, 1500);
  };

  return (
    <div className="gradient-background p-4 rounded-lg flex flex-col space-y-4 min-w-sm max-md:min-w-2xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <img
            src={`https://assets.coincap.io/assets/icons/${coin.coinShort.toLowerCase()}@2x.png`}
            alt={coin.coinShort}
            className="w-6 h-6"
          />
          <div className="text-sm font-bold">{coin.coinName}</div>
        </div>
        <div className="text-xs text-neutral-400">
          Balance: {formatNumber(coin.userBalance, 4)} {coin.coinShort}
        </div>
      </div>

      <div className="space-y-6">
        {/* From section */}
        <div className="space-y-2.5">
          <label className="text-[10px] text-neutral-400">From</label>
          <div className="bg-neutral-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <img
                  src={`https://assets.coincap.io/assets/icons/${coin.coinShort.toLowerCase()}@2x.png`}
                  alt={coin.coinShort}
                  className="w-6 h-6"
                />
                <span className="text-xs font-medium">{coin.coinShort}</span>
              </div>
              <button
                onClick={handleMaxAmount}
                className="text-xs text-green-500 hover:text-green-400 smooth"
                aria-label="Use maximum amount"
                tabIndex={0}
              >
                MAX
              </button>
            </div>
            <input
              type="text"
              value={fromAmount}
              onChange={handleFromAmountChange}
              placeholder="0.00"
              className="w-full bg-transparent text-white outline-none text-xs"
              aria-label={`Amount of ${coin.coinShort} to swap`}
            />
            {fromAmount && (
              <div className="text-xs text-neutral-400 mt-1">
                ≈ {formatCurrency(parseFloat(fromAmount) * parseFloat(coin.price), "USD")}
              </div>
            )}
          </div>
        </div>

        {/* Swap icon */}
        <div className="flex justify-center">
          <button
            onClick={handleSwapCoins}
            className="bg-neutral-800 hover:bg-neutral-700 smooth p-2 rounded-full"
            aria-label="Swap direction"
            tabIndex={0}
          >
            <i className="fi fi-rr-arrows-repeat text-neutral-400"></i>
          </button>
        </div>

        {/* To section */}
        <div className="space-y-2.5">
          <label className="text-[10px] text-neutral-400">To</label>
          <div className="bg-neutral-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="relative">
                <select
                  value={toCoin}
                  onChange={(e) => setToCoin(e.target.value)}
                  className="appearance-none bg-transparent text-white outline-none pr-8 text-xs font-medium flex items-center space-x-2"
                  aria-label="Select coin to receive"
                >
                  {filteredCoins.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                  <i className="fi fi-rr-angle-down text-neutral-400"></i>
                </div>
              </div>
            </div>
            <input
              type="text"
              value={toAmount}
              onChange={handleToAmountChange}
              placeholder="0.00"
              className="w-full bg-transparent text-white outline-none text-xs"
              aria-label={`Amount of ${toCoin} to receive`}
            />
            {/* In a real app, you would show the USD value here too */}
          </div>
        </div>

        {/* Exchange rate */}
        <div className="text-xs text-neutral-400 flex justify-between">
          <span>Exchange Rate</span>
          <span>1 {coin.coinShort} ≈ {exchangeRate.toFixed(6)} {toCoin}</span>
        </div>

        {error && (
          <div className="text-red-500 text-xs p-2 bg-red-500/10 rounded-lg flex items-center space-x-2">
            <i className="fi fi-rr-exclamation mr-1"></i>
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleSwap}
          disabled={isLoading}
          className="rounded-full gradient-background hover:bg-neutral-800/50 smooth !px-4 !py-2 text-white text-xs flex items-center justify-center space-x-2 mx-auto"
          aria-label="Confirm swap"
          tabIndex={0}
        >
          {isLoading ? (
            <>
              <i className="fi fi-rr-spinner animate-spin"></i>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <i className="fi fi-rr-refresh"></i>
              <span>Swap {coin.coinShort}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default Swap; 