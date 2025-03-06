import { useState, useEffect, useCallback } from 'react';
import { formatLength } from '../../util/formatCurrency';
import { saveItem } from '../../util/storage';
import Modal from '../common/Modal';

export interface MarketData {
    PRICE?: number;
    MKTCAP?: number;
    CHANGEPCT24HOUR?: number;
    SUPPLY?: number;
    HIGH24HOUR?: number;
    LOW24HOUR?: number;
    VOLUME24HOUR?: number;
    FUNDING?: number;
    MARKET?: string;
    BASE?: string;
    QUOTE?: string;
}


const AVAILABLE_PAIRS = [
    // USDT Pairs (Tether)
    { base: 'BTC', quote: 'USDT' },
    { base: 'ETH', quote: 'USDT' },
    { base: 'SOL', quote: 'USDT' },
    { base: 'BNB', quote: 'USDT' },
    { base: 'XRP', quote: 'USDT' },
    { base: 'ADA', quote: 'USDT' },
    { base: 'DOGE', quote: 'USDT' },
    { base: 'DOT', quote: 'USDT' },
    { base: 'MATIC', quote: 'USDT' },
    { base: 'LINK', quote: 'USDT' },
    { base: 'AVAX', quote: 'USDT' },
    { base: 'UNI', quote: 'USDT' },
    // USD Pairs (US Dollar)
    { base: 'BTC', quote: 'USD' },
    { base: 'ETH', quote: 'USD' },
    { base: 'SOL', quote: 'USD' },
    { base: 'BNB', quote: 'USD' },
    { base: 'XRP', quote: 'USD' },
    { base: 'ADA', quote: 'USD' }
];

const PairBanner = ({ setSymbol }: { setSymbol: (symbol: MarketData) => void }) => {
    const [selectedPair, setSelectedPair] = useState(AVAILABLE_PAIRS[0]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [marketData, setMarketData] = useState<MarketData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchMarketData = useCallback(async () => {
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
    }, [selectedPair, setSymbol]);

    useEffect(() => {

        fetchMarketData();
        const interval = setInterval(fetchMarketData, 30000);

        return () => clearInterval(interval);
    }, [fetchMarketData]);

    const handlePairSelect = (pair: typeof AVAILABLE_PAIRS[0]) => {
        setSelectedPair(pair);
        setIsDropdownOpen(false);
    };

    if (!marketData) return null;

    const MarketDataContent = () => (
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <p className="text-[10px] text-neutral-500">Market Cap</p>
                <p className="font-medium text-sm">
                    ${formatLength(marketData.MKTCAP || 0)}
                </p>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] text-neutral-500">Supply</p>
                <p className="font-medium text-sm">
                    {formatLength(marketData.SUPPLY || 0)}
                </p>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] text-neutral-500">24h Change</p>
                <p className={`font-medium text-sm ${marketData.CHANGEPCT24HOUR && marketData.CHANGEPCT24HOUR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {marketData.CHANGEPCT24HOUR?.toFixed(2)}%
                </p>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] text-neutral-500">24h High/Low</p>
                <p className="font-medium text-sm">
                    ${formatLength(marketData.HIGH24HOUR || 0)} / ${formatLength(marketData.LOW24HOUR || 0)}
                </p>
            </div>
            <div className="space-y-1 col-span-2">
                <p className="text-[10px] text-neutral-500">24h Volume</p>
                <p className="font-medium text-sm">
                    ${formatLength(marketData.VOLUME24HOUR || 0)}
                </p>
            </div>
        </div>
    );

    return (
        <>
            <div className="w-full gradient-background p-4 rounded-lg relative ">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className='border-r-0 md:border-r border-neutral-700/30 space-y-1 px-0 md:px-4 w-full md:w-auto'>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => setIsDropdownOpen(true)}
                                    className="flex items-center space-x-2 hover:opacity-80"
                                    aria-label="Select trading pair"
                                    tabIndex={0}
                                >
                                    <div className="flex items-center -space-x-1">
                                        <img src={`https://assets.coincap.io/assets/icons/${selectedPair.base.toLowerCase()}@2x.png`} alt={selectedPair.base} className="w-4 h-4 rounded-full" />
                                        <img src={`https://assets.coincap.io/assets/icons/${selectedPair.quote.toLowerCase()}@2x.png`} alt={selectedPair.quote} className="w-4 h-4 rounded-full" />
                                    </div>
                                    <span className="text-sm font-bold">
                                        {selectedPair.base}-{selectedPair.quote}
                                    </span>
                                    <i className="fi fi-rr-angle-down text-xs transition-all duration-300" />
                                </button>


                                <span className={`text-sm font-medium ${marketData.CHANGEPCT24HOUR && marketData.CHANGEPCT24HOUR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    ${marketData.PRICE?.toLocaleString()}
                                </span>
                            </div>

                            {/* Mobile info button */}
                            <button
                                className="md:hidden !p-2 hover:bg-neutral-800/50 !rounded-full smooth gradient-background  "
                                onClick={() => setIsModalOpen(true)}
                            >
                                <i className="fi fi-rr-info text-neutral-500" />
                            </button>
                        </div>
                        <div className='text-xs text-neutral-500'>
                            {marketData.MARKET}
                        </div>
                    </div>

                    {/* Desktop view for market data */}
                    <div className='w-full md:w-auto hidden md:block'>
                        <div className='flex justify-between items-center'>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:items-center gap-2 md:gap-6 lg:gap-14 w-full">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-neutral-500">Market Cap</p>
                                    <p className="font-medium lg:text-sm text-xs" >
                                        ${formatLength(marketData.MKTCAP || 0)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-neutral-500">Supply</p>
                                    <p className="font-medium lg:text-sm text-xs" >
                                        {formatLength(marketData.SUPPLY || 0)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-neutral-500">24h Change</p>
                                    <p className={`font-medium lg:text-sm text-xs ${marketData.CHANGEPCT24HOUR && marketData.CHANGEPCT24HOUR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {marketData.CHANGEPCT24HOUR?.toFixed(2)}%
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] text-neutral-500">24h High/Low</p>
                                    <p className="font-medium lg:text-sm text-xs">
                                        ${formatLength(marketData.HIGH24HOUR || 0)} / ${formatLength(marketData.LOW24HOUR || 0)}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] text-neutral-500">24h Volume</p>
                                    <p className="font-medium lg:text-sm text-xs">
                                        ${formatLength(marketData.VOLUME24HOUR || 0)}
                                    </p>
                                </div>
                            </div>
                            <div className='p-2 md:p-4'>
                                <button className='hover:rounded-full p-2 hover:bg-neutral-800/50 smooth'>
                                    <i className='fi fi-rr-settings text-neutral-500' />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`${selectedPair.base}-${selectedPair.quote} Market Data`}
            >
                <MarketDataContent />
            </Modal>
            <Modal
                isOpen={isDropdownOpen}
                onClose={() => setIsDropdownOpen(false)}
                title="Select Trading Pair"
            >
                <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-none">
                    {AVAILABLE_PAIRS.map((pair) => (
                        <button
                            key={`${pair.base}-${pair.quote}`}
                            onClick={() => {
                                handlePairSelect(pair);
                                setIsDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-neutral-800/50 rounded-lg flex items-center justify-between group smooth"
                            aria-label={`Select ${pair.base}-${pair.quote} pair`}
                            tabIndex={0}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center -space-x-1">
                                    <img
                                        src={`https://assets.coincap.io/assets/icons/${pair.base.toLowerCase()}@2x.png`}
                                        alt={pair.base}
                                        className="w-6 h-6 rounded-full z-10"
                                    />
                                    <img
                                        src={`https://assets.coincap.io/assets/icons/${pair.quote.toLowerCase()}@2x.png`}
                                        alt={pair.quote}
                                        className="w-6 h-6 rounded-full"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium">
                                        {pair.base}-{pair.quote}
                                    </span>
                                    <span className="text-xs text-neutral-500">
                                        {pair.base} / {pair.quote}
                                    </span>
                                </div>
                            </div>
                            <i className="fi fi-rr-angle-right text-neutral-500 opacity-0 group-hover:opacity-100 smooth" />
                        </button>
                    ))}
                </div>
            </Modal>
        </>
    );
};

export default PairBanner; 