import { useState, useEffect, useMemo } from 'react';
import { formatNumber } from '../util/formatCurrency';
import { MarketData } from '../components/dashboard/PairBanner';
import { getItem } from '../util';

type NetworkConnection = {
  downlink: number;
  rtt: number;
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
};

function Footer() {
  const [connectionStatus, setConnectionStatus] = useState({
    speed: 'Checking...',
    isStable: true

  });
  const [symbols, setSymbols] = useState<MarketData | null>(null);




  const [cryptoPrices, setCryptoPrices] = useState<{
    [key: string]: { price: number; change24h: number }
  }>({});

  const pairs = useMemo(() => ['BTC', 'ETH', 'BNB', 'SOL', 'ADA'], []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const updateConnectionStatus = () => {
      try {
        // Check if the API is supported
        if (!('connection' in navigator)) {
          setConnectionStatus({
            speed: 'Not supported',
            isStable: true
          });
          return;
        }

        const connection = (navigator as Navigator & { 
          connection: NetworkConnection 
        }).connection;

        if (!connection) {
          setConnectionStatus({
            speed: 'Unavailable',
            isStable: true
          });
          return;
        }

        const speed = connection.downlink 
          ? `${connection.downlink.toFixed(1)} Mbps` 
          : 'Unknown';

        const isStable = connection.rtt < 200;
        
        setConnectionStatus({
          speed,
          isStable
        });
      } catch (error) {
        console.error('Error updating connection status:', error);
        setConnectionStatus({
          speed: 'Error',
          isStable: false
        });
      }
    };

    // Initial check
    updateConnectionStatus();

    try {
      const connection = (navigator as Navigator & { 
        connection: NetworkConnection 
      }).connection;
      
      if (connection) {
        connection.addEventListener('change', updateConnectionStatus);
        // Update every 5 seconds
        interval = setInterval(updateConnectionStatus, 5000);
      }
    } catch (error) {
      console.error('Error setting up connection listeners:', error);
    }

    return () => {
      try {
        const connection = (navigator as Navigator & { 
          connection: NetworkConnection 
        }).connection;
        
        if (connection) {
          connection.removeEventListener('change', updateConnectionStatus);
        }
        if (interval) {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error cleaning up connection listeners:', error);
      }
    };
  }, []);
  

useEffect(() => {
  const fetchSymbols = () => {
    const storedSymbols = getItem('symbols');
    if (storedSymbols) {
      const symbols: MarketData = JSON.parse(storedSymbols);
      setSymbols(symbols);
    }
  };
  fetchSymbols();
}, []);


  useEffect(() => {
    const fetchCryptoPrices = async () => {
      try {
        if (!symbols?.QUOTE) return; // Early return if quote currency isn't available
        
        const response = await fetch(
          `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${pairs.join(',')}&tsyms=${symbols.QUOTE}`
        );
        const data = await response.json();

        const prices = pairs.reduce((acc: {[key: string]: { price: number; change24h: number }}, symbol) => {
          const rawData = data.RAW[symbol]?.[symbols!.QUOTE as string];
          if (rawData) {
            acc[symbol] = {
              price: rawData.PRICE,
              change24h: rawData.CHANGEPCT24HOUR
            };
          }
          return acc;
        }, {});
        
        setCryptoPrices(prices);
      } catch (error) {
        console.error('Error fetching crypto prices:', error);
      }
    };

    // Only fetch if we have the quote currency
    if (symbols?.QUOTE) {
      fetchCryptoPrices();
      const interval = setInterval(fetchCryptoPrices, 30000);
      return () => clearInterval(interval);
    }
  }, [pairs, symbols]); // Add symbols.QUOTE as dependency

  return (
    <footer className="!fixed bottom-0 w-full gradient-background !py-2">
      <div className="flex space-x-6 animate-scroll">
        <div className="flex items-center space-x-2 text-xs text-neutral-500">
          <span>Connection:</span>
          <span className={connectionStatus.isStable ? "text-green-400" : "text-red-400"}>
            {connectionStatus.speed}
          </span>
        </div>

        {pairs.map((coin) => (
          <div key={coin} className="flex items-center space-x-2 text-xs text-neutral-500">
            <span>{coin}/{symbols?.QUOTE}</span>
            {cryptoPrices[coin] ? (



              <>
                <span>{formatNumber(cryptoPrices[coin].price)}</span>
                <span className={`${cryptoPrices[coin].change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>

                  {cryptoPrices[coin].change24h >= 0 ? '+' : ''}{cryptoPrices[coin].change24h.toFixed(2)}%
                </span>
              </>
            ) : (
              <span className="text-gray-400">Loading...</span>
            )}
          </div>
        ))}
      </div>
    </footer>
  );
}

export default Footer