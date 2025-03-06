import { useState } from "react";
import { UserCoinsProps } from "../../types/wallet";
import { formatCurrency, formatNumber } from "../../util/formatCurrency";

function Send({ coin }: { coin: UserCoinsProps }) {
  const [amount, setAmount] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    setError(null);
  };

  const handleMaxAmount = () => {
    setAmount(coin.userBalance.toString());
  };

  const handleSend = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (parseFloat(amount) > coin.userBalance) {
      setError("Insufficient balance");
      return;
    }

    if (!address || address.length < 10) {
      setError("Please enter a valid wallet address");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert(`Successfully sent ${amount} ${coin.coinShort} to ${address}`);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
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

      <div className="space-y-4">
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
              aria-label="Amount to send"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
              <button
                onClick={handleMaxAmount}
                className="text-xs text-green-500 hover:text-green-400 smooth"
                aria-label="Use maximum amount"
                tabIndex={0}
              >
                MAX
              </button>
              <span className="text-xs font-medium">{coin.coinShort}</span>
            </div>
          </div>
          {amount && (
            <div className="text-xs text-neutral-400">
              ≈ {formatCurrency(parseFloat(amount) * parseFloat(coin.price), "USD")}
            </div>
          )}
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
              onClick={() => navigator.clipboard.readText().then(text => handleAddressChange({ target: { value: text } } as React.ChangeEvent<HTMLInputElement>))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-500 hover:text-green-400 smooth flex items-center space-x-1"
              aria-label="Paste address from clipboard"
              tabIndex={0}
            >
              <i className="fi fi-rr-paste"></i>
              <span>Paste</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-xs p-2 bg-red-500/10 rounded-lg flex items-center space-x-2">
            <i className="fi fi-rr-exclamation mr-1"></i>
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={isLoading}
          className=" !rounded-full gradient-background hover:bg-neutral-800/50 text-xs smooth !px-4 !py-2 text-white font-medium flex items-center justify-center space-x-2 mx-auto"
          aria-label="Send transaction"
          tabIndex={0}
        >
          {isLoading ? (
            <>
              <i className="fi fi-rr-spinner animate-spin"></i>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <i className="fi fi-rr-paper-plane"></i>
              <span>Send {coin.coinShort}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default Send;