import { useState, useEffect } from 'react';
import Dropdown from '../common/Dropdown';
import { formatLength } from '../../util/formatCurrency';
import { saveItem } from '../../util';

export interface MarketData {
    PRICE: number;
    MKTCAP: number;
    CHANGEPCT24HOUR: number;
    SUPPLY: number;
    HIGH24HOUR: number;
    LOW24HOUR: number;
    VOLUME24HOUR: number;
    FUNDING: number;
    MARKET: string;
    BASE?: string;
    QUOTE?: string;
}


const AVAILABLE_PAIRS = [
    { base: 'BTC', quote: 'USDT' },
    { base: 'ETH', quote: 'USDT' },
    { base: 'SOL', quote: 'USDT' },
    // Add more pairs as needed
];

const PairBanner = ({setSymbol}: {setSymbol: (symbol: MarketData) => void}) => {
    const [selectedPair, setSelectedPair] = useState(AVAILABLE_PAIRS[0]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [marketData, setMarketData] = useState<MarketData | null>(null);

    useEffect(() => {
        const fetchMarketData = async () => {
            try {
                const response = await fetch(
                    `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${selectedPair.base}&tsyms=${selectedPair.quote}`
                );
                const data = await response.json();
                const rawData = data.RAW[selectedPair.base][selectedPair.quote];
                setMarketData(rawData);
               const symbols = {
                BASE: selectedPair.base,
                QUOTE: selectedPair.quote,
                PRICE: rawData.PRICE,
                CHANGEPCT24HOUR: rawData.CHANGEPCT24HOUR,
                MARKET: rawData.MARKET,
                MKTCAP: rawData.MKTCAP,
                SUPPLY: rawData.SUPPLY,
                HIGH24HOUR: rawData.HIGH24HOUR,
                LOW24HOUR: rawData.LOW24HOUR,
                VOLUME24HOUR: rawData.VOLUME24HOUR,
                FUNDING: rawData.FUNDING
            };
                setSymbol(symbols);
                saveItem('symbols', JSON.stringify(symbols));






            } catch (error) {
                console.error('Error fetching market data:', error);
            }
        };

        fetchMarketData();
        const interval = setInterval(fetchMarketData, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, [selectedPair]);

    const handlePairSelect = (pair: typeof AVAILABLE_PAIRS[0]) => {
        setSelectedPair(pair);
        setIsDropdownOpen(false);
    };

    if (!marketData) return null;

    return (
        <div className="w-full gradient-background p-4 rounded-lg">
            <div className="flex items-center justify-between">
                <div className='border-r border-neutral-700/30 space-y-1 px-4'>
                    <div className="flex items-center space-x-4">
                        <Dropdown
                            isOpen={isDropdownOpen}
                            onClose={() => setIsDropdownOpen(false)}
                            trigger={
                                <button
                                    onClick={() => setIsDropdownOpen(true)}
                                    className="flex items-center space-x-2 hover:opacity-80"
                                >
                                    <span className="text-sm font-bold">
                                        {selectedPair.base}-{selectedPair.quote}
                                    </span>
                                    <i className={`fi fi-rr-angle-down text-xs ${isDropdownOpen ? 'rotate-180' : ''} transition-all duration-300`} />
                                </button>
                            }
                            items={AVAILABLE_PAIRS}
                            renderItem={(pair) => (
                                <button
                                    onClick={() => handlePairSelect(pair)}
                                    className="w-full text-left px-3 py-2 hover:bg-neutral-800 rounded"
                                >
                                    {pair.base}-{pair.quote}
                                </button>
                            )}
                        />
                        <span className={`text-sm font-medium ${marketData.CHANGEPCT24HOUR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ${marketData.PRICE.toLocaleString()}
                        </span>
                    </div>
                    <div className='text-xs text-neutral-500'>
                        {marketData.MARKET}
                    </div>
                </div>
                <div className='flex space-x-8 items-center'>
                    <div className="flex items-center space-x-8">
                        <div className="space-y-1">
                            <p className="text-[10px] text-neutral-500">Market Cap</p>
                            <p className="font-medium text-sm " >
                                ${formatLength(marketData.MKTCAP)}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-neutral-500">Supply</p>
                            <p className="font-medium text-sm " >
                                {formatLength(marketData.SUPPLY)}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-neutral-500">24h Change</p>
                            <p className={`font-medium text-sm ${marketData.CHANGEPCT24HOUR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {marketData.CHANGEPCT24HOUR.toFixed(2)}%
                            </p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] text-neutral-500">24h High/Low</p>
                            <p className="font-medium text-sm">
                                ${formatLength(marketData.HIGH24HOUR)} / ${formatLength(marketData.LOW24HOUR)}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] text-neutral-500">24h Volume</p>
                            <p className="font-medium text-sm">
                                ${formatLength(marketData.VOLUME24HOUR)}
                            </p>
                        </div>
                    </div>
                    <div className='p-4'>
                        <button className='hover:rounded-full'>
                            <i className='fi fi-rr-settings text-neutral-500' />
                        </button>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default PairBanner; 