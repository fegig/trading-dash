import { useState, useEffect, useCallback } from 'react';
import { formatLength } from '@/util/formatCurrency';
import { saveItem } from '@/util/storage';
import Modal from '../common/Modal';
import { get } from '@/util/request';
import { endpoints } from '@/services/endpoints';

export type AssetCategory = 'crypto' | 'stock' | 'etf' | 'forex' | 'commodity';

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
    category?: AssetCategory;
    label?: string;
}

type PriceStatus = 'loading' | 'ok' | 'unavailable';

type PriceResponse = {
    price: number;
    changePct24h: number;
    high24h: number | null;
    low24h: number | null;
    volume24h: number | null;
};

type CryptoCompareRaw = {
    PRICE: number;
    CHANGEPCT24HOUR?: number;
    MARKET?: string;
    MKTCAP?: number;
    SUPPLY?: number;
    HIGH24HOUR?: number;
    LOW24HOUR?: number;
    VOLUME24HOUR?: number;
    FUNDING?: number;
};

type PriceMultiFullResponse = {
    RAW?: Record<string, Record<string, CryptoCompareRaw>>;
};

export interface Instrument {
    symbol: string;
    base: string;
    quote: string;
    category: AssetCategory;
    label: string;
    market?: string;
}

const AVAILABLE_INSTRUMENTS: Instrument[] = [
    // ── Crypto ──────────────────────────────────────────────────────────────
    { symbol: 'BTC-USDT',  base: 'BTC',  quote: 'USDT', category: 'crypto', label: 'Bitcoin' },
    { symbol: 'ETH-USDT',  base: 'ETH',  quote: 'USDT', category: 'crypto', label: 'Ethereum' },
    { symbol: 'SOL-USDT',  base: 'SOL',  quote: 'USDT', category: 'crypto', label: 'Solana' },
    { symbol: 'BNB-USDT',  base: 'BNB',  quote: 'USDT', category: 'crypto', label: 'BNB' },
    { symbol: 'XRP-USDT',  base: 'XRP',  quote: 'USDT', category: 'crypto', label: 'XRP' },
    { symbol: 'ADA-USDT',  base: 'ADA',  quote: 'USDT', category: 'crypto', label: 'Cardano' },
    { symbol: 'DOGE-USDT', base: 'DOGE', quote: 'USDT', category: 'crypto', label: 'Dogecoin' },
    { symbol: 'AVAX-USDT', base: 'AVAX', quote: 'USDT', category: 'crypto', label: 'Avalanche' },
    { symbol: 'LINK-USDT', base: 'LINK', quote: 'USDT', category: 'crypto', label: 'Chainlink' },
    { symbol: 'DOT-USDT',  base: 'DOT',  quote: 'USDT', category: 'crypto', label: 'Polkadot' },
    { symbol: 'MATIC-USDT',base: 'MATIC',quote: 'USDT', category: 'crypto', label: 'Polygon' },
    { symbol: 'UNI-USDT',  base: 'UNI',  quote: 'USDT', category: 'crypto', label: 'Uniswap' },
    { symbol: 'LTC-USDT',  base: 'LTC',  quote: 'USDT', category: 'crypto', label: 'Litecoin' },
    { symbol: 'BCH-USDT',  base: 'BCH',  quote: 'USDT', category: 'crypto', label: 'Bitcoin Cash' },
    { symbol: 'ATOM-USDT', base: 'ATOM', quote: 'USDT', category: 'crypto', label: 'Cosmos' },
    { symbol: 'NEAR-USDT', base: 'NEAR', quote: 'USDT', category: 'crypto', label: 'NEAR Protocol' },
    { symbol: 'ARB-USDT',  base: 'ARB',  quote: 'USDT', category: 'crypto', label: 'Arbitrum' },
    { symbol: 'OP-USDT',   base: 'OP',   quote: 'USDT', category: 'crypto', label: 'Optimism' },
    { symbol: 'APT-USDT',  base: 'APT',  quote: 'USDT', category: 'crypto', label: 'Aptos' },
    { symbol: 'SUI-USDT',  base: 'SUI',  quote: 'USDT', category: 'crypto', label: 'Sui' },
    { symbol: 'TON-USDT',  base: 'TON',  quote: 'USDT', category: 'crypto', label: 'Toncoin' },
    { symbol: 'TRX-USDT',  base: 'TRX',  quote: 'USDT', category: 'crypto', label: 'TRON' },
    { symbol: 'SHIB-USDT', base: 'SHIB', quote: 'USDT', category: 'crypto', label: 'Shiba Inu' },
    { symbol: 'PEPE-USDT', base: 'PEPE', quote: 'USDT', category: 'crypto', label: 'Pepe' },
    { symbol: 'ALGO-USDT', base: 'ALGO', quote: 'USDT', category: 'crypto', label: 'Algorand' },
    { symbol: 'FIL-USDT',  base: 'FIL',  quote: 'USDT', category: 'crypto', label: 'Filecoin' },
    { symbol: 'ICP-USDT',  base: 'ICP',  quote: 'USDT', category: 'crypto', label: 'Internet Computer' },
    { symbol: 'MANA-USDT', base: 'MANA', quote: 'USDT', category: 'crypto', label: 'Decentraland' },
    { symbol: 'SAND-USDT', base: 'SAND', quote: 'USDT', category: 'crypto', label: 'The Sandbox' },
    { symbol: 'AXS-USDT',  base: 'AXS',  quote: 'USDT', category: 'crypto', label: 'Axie Infinity' },
    { symbol: 'BTC-USD',   base: 'BTC',  quote: 'USD',  category: 'crypto', label: 'Bitcoin/USD' },
    { symbol: 'ETH-USD',   base: 'ETH',  quote: 'USD',  category: 'crypto', label: 'Ethereum/USD' },
    // ── Stocks ──────────────────────────────────────────────────────────────
    { symbol: 'AAPL-USD',  base: 'AAPL',  quote: 'USD', category: 'stock', label: 'Apple Inc.',           market: 'NASDAQ' },
    { symbol: 'MSFT-USD',  base: 'MSFT',  quote: 'USD', category: 'stock', label: 'Microsoft Corp.',      market: 'NASDAQ' },
    { symbol: 'GOOGL-USD', base: 'GOOGL', quote: 'USD', category: 'stock', label: 'Alphabet Inc.',        market: 'NASDAQ' },
    { symbol: 'AMZN-USD',  base: 'AMZN',  quote: 'USD', category: 'stock', label: 'Amazon.com Inc.',      market: 'NASDAQ' },
    { symbol: 'TSLA-USD',  base: 'TSLA',  quote: 'USD', category: 'stock', label: 'Tesla Inc.',           market: 'NASDAQ' },
    { symbol: 'NVDA-USD',  base: 'NVDA',  quote: 'USD', category: 'stock', label: 'NVIDIA Corp.',         market: 'NASDAQ' },
    { symbol: 'META-USD',  base: 'META',  quote: 'USD', category: 'stock', label: 'Meta Platforms',       market: 'NASDAQ' },
    { symbol: 'NFLX-USD',  base: 'NFLX',  quote: 'USD', category: 'stock', label: 'Netflix Inc.',         market: 'NASDAQ' },
    { symbol: 'AMD-USD',   base: 'AMD',   quote: 'USD', category: 'stock', label: 'AMD Inc.',             market: 'NASDAQ' },
    { symbol: 'INTC-USD',  base: 'INTC',  quote: 'USD', category: 'stock', label: 'Intel Corp.',          market: 'NASDAQ' },
    { symbol: 'JPM-USD',   base: 'JPM',   quote: 'USD', category: 'stock', label: 'JPMorgan Chase',       market: 'NYSE' },
    { symbol: 'V-USD',     base: 'V',     quote: 'USD', category: 'stock', label: 'Visa Inc.',            market: 'NYSE' },
    { symbol: 'JNJ-USD',   base: 'JNJ',   quote: 'USD', category: 'stock', label: 'Johnson & Johnson',    market: 'NYSE' },
    { symbol: 'WMT-USD',   base: 'WMT',   quote: 'USD', category: 'stock', label: 'Walmart Inc.',         market: 'NYSE' },
    { symbol: 'DIS-USD',   base: 'DIS',   quote: 'USD', category: 'stock', label: 'Walt Disney Co.',      market: 'NYSE' },
    { symbol: 'PFE-USD',   base: 'PFE',   quote: 'USD', category: 'stock', label: 'Pfizer Inc.',          market: 'NYSE' },
    { symbol: 'KO-USD',    base: 'KO',    quote: 'USD', category: 'stock', label: 'Coca-Cola Co.',        market: 'NYSE' },
    { symbol: 'XOM-USD',   base: 'XOM',   quote: 'USD', category: 'stock', label: 'ExxonMobil Corp.',     market: 'NYSE' },
    { symbol: 'BA-USD',    base: 'BA',    quote: 'USD', category: 'stock', label: 'Boeing Co.',           market: 'NYSE' },
    { symbol: 'BABA-USD',  base: 'BABA',  quote: 'USD', category: 'stock', label: 'Alibaba Group',        market: 'NYSE' },
    { symbol: 'PLTR-USD',  base: 'PLTR',  quote: 'USD', category: 'stock', label: 'Palantir Technologies',market: 'NYSE' },
    { symbol: 'COIN-USD',  base: 'COIN',  quote: 'USD', category: 'stock', label: 'Coinbase Global',      market: 'NASDAQ' },
    { symbol: 'HOOD-USD',  base: 'HOOD',  quote: 'USD', category: 'stock', label: 'Robinhood Markets',    market: 'NASDAQ' },
    { symbol: 'PYPL-USD',  base: 'PYPL',  quote: 'USD', category: 'stock', label: 'PayPal Holdings',      market: 'NASDAQ' },
    { symbol: 'UBER-USD',  base: 'UBER',  quote: 'USD', category: 'stock', label: 'Uber Technologies',    market: 'NYSE' },
    { symbol: 'SHOP-USD',  base: 'SHOP',  quote: 'USD', category: 'stock', label: 'Shopify Inc.',         market: 'NYSE' },
    // ── ETFs ────────────────────────────────────────────────────────────────
    { symbol: 'SPY-USD',  base: 'SPY',  quote: 'USD', category: 'etf', label: 'S&P 500 ETF (SPY)',         market: 'NYSE' },
    { symbol: 'QQQ-USD',  base: 'QQQ',  quote: 'USD', category: 'etf', label: 'Nasdaq 100 ETF (QQQ)',      market: 'NASDAQ' },
    { symbol: 'GLD-USD',  base: 'GLD',  quote: 'USD', category: 'etf', label: 'Gold ETF (GLD)',            market: 'NYSE' },
    { symbol: 'SLV-USD',  base: 'SLV',  quote: 'USD', category: 'etf', label: 'Silver ETF (SLV)',         market: 'NYSE' },
    { symbol: 'VTI-USD',  base: 'VTI',  quote: 'USD', category: 'etf', label: 'Vanguard Total Market',    market: 'NYSE' },
    { symbol: 'IWM-USD',  base: 'IWM',  quote: 'USD', category: 'etf', label: 'Russell 2000 (IWM)',       market: 'NYSE' },
    { symbol: 'DIA-USD',  base: 'DIA',  quote: 'USD', category: 'etf', label: 'Dow Jones ETF (DIA)',       market: 'NYSE' },
    { symbol: 'EFA-USD',  base: 'EFA',  quote: 'USD', category: 'etf', label: 'iShares Intl Dev (EFA)',   market: 'NYSE' },
    { symbol: 'EEM-USD',  base: 'EEM',  quote: 'USD', category: 'etf', label: 'Emerg. Markets (EEM)',     market: 'NYSE' },
    { symbol: 'TLT-USD',  base: 'TLT',  quote: 'USD', category: 'etf', label: '20+ Yr Treasury (TLT)',   market: 'NASDAQ' },
    { symbol: 'ARKK-USD', base: 'ARKK', quote: 'USD', category: 'etf', label: 'ARK Innovation (ARKK)',    market: 'NYSE' },
    { symbol: 'XLF-USD',  base: 'XLF',  quote: 'USD', category: 'etf', label: 'Financial Sector (XLF)',  market: 'NYSE' },
    { symbol: 'XLE-USD',  base: 'XLE',  quote: 'USD', category: 'etf', label: 'Energy Sector (XLE)',     market: 'NYSE' },
    { symbol: 'XLK-USD',  base: 'XLK',  quote: 'USD', category: 'etf', label: 'Technology Sector (XLK)', market: 'NYSE' },
    { symbol: 'SOXX-USD', base: 'SOXX', quote: 'USD', category: 'etf', label: 'Semiconductor (SOXX)',     market: 'NASDAQ' },
    { symbol: 'VXUS-USD', base: 'VXUS', quote: 'USD', category: 'etf', label: 'Total Intl Stock (VXUS)',  market: 'NASDAQ' },
    // ── Forex ────────────────────────────────────────────────────────────────
    { symbol: 'EUR-USD',  base: 'EUR', quote: 'USD', category: 'forex', label: 'Euro / US Dollar',          market: 'OANDA' },
    { symbol: 'GBP-USD',  base: 'GBP', quote: 'USD', category: 'forex', label: 'British Pound / USD',       market: 'OANDA' },
    { symbol: 'USD-JPY',  base: 'USD', quote: 'JPY', category: 'forex', label: 'US Dollar / Japanese Yen',  market: 'OANDA' },
    { symbol: 'AUD-USD',  base: 'AUD', quote: 'USD', category: 'forex', label: 'Australian Dollar / USD',   market: 'OANDA' },
    { symbol: 'USD-CHF',  base: 'USD', quote: 'CHF', category: 'forex', label: 'US Dollar / Swiss Franc',   market: 'OANDA' },
    { symbol: 'USD-CAD',  base: 'USD', quote: 'CAD', category: 'forex', label: 'US Dollar / Canadian Dollar',market: 'OANDA' },
    { symbol: 'EUR-GBP',  base: 'EUR', quote: 'GBP', category: 'forex', label: 'Euro / British Pound',       market: 'OANDA' },
    { symbol: 'EUR-JPY',  base: 'EUR', quote: 'JPY', category: 'forex', label: 'Euro / Japanese Yen',        market: 'OANDA' },
    { symbol: 'NZD-USD',  base: 'NZD', quote: 'USD', category: 'forex', label: 'New Zealand Dollar / USD',  market: 'OANDA' },
    { symbol: 'GBP-JPY',  base: 'GBP', quote: 'JPY', category: 'forex', label: 'British Pound / Yen',        market: 'OANDA' },
    { symbol: 'EUR-CHF',  base: 'EUR', quote: 'CHF', category: 'forex', label: 'Euro / Swiss Franc',         market: 'OANDA' },
    { symbol: 'AUD-JPY',  base: 'AUD', quote: 'JPY', category: 'forex', label: 'Australian Dollar / Yen',   market: 'OANDA' },
    { symbol: 'EUR-CAD',  base: 'EUR', quote: 'CAD', category: 'forex', label: 'Euro / Canadian Dollar',     market: 'OANDA' },
    { symbol: 'GBP-CAD',  base: 'GBP', quote: 'CAD', category: 'forex', label: 'British Pound / CAD',        market: 'OANDA' },
    { symbol: 'USD-SGD',  base: 'USD', quote: 'SGD', category: 'forex', label: 'US Dollar / Singapore Dollar',market: 'OANDA' },
    { symbol: 'USD-MXN',  base: 'USD', quote: 'MXN', category: 'forex', label: 'US Dollar / Mexican Peso',  market: 'OANDA' },
    { symbol: 'USD-HKD',  base: 'USD', quote: 'HKD', category: 'forex', label: 'US Dollar / Hong Kong Dollar',market: 'OANDA' },
    { symbol: 'USD-TRY',  base: 'USD', quote: 'TRY', category: 'forex', label: 'US Dollar / Turkish Lira',  market: 'OANDA' },
    // ── Commodities ─────────────────────────────────────────────────────────
    { symbol: 'XAU-USD',    base: 'XAU',    quote: 'USD', category: 'commodity', label: 'Gold (XAU/USD)',          market: 'OANDA' },
    { symbol: 'XAG-USD',    base: 'XAG',    quote: 'USD', category: 'commodity', label: 'Silver (XAG/USD)',        market: 'OANDA' },
    { symbol: 'WTICO-USD',  base: 'WTICO',  quote: 'USD', category: 'commodity', label: 'WTI Crude Oil',           market: 'OANDA' },
    { symbol: 'BCO-USD',    base: 'BCO',    quote: 'USD', category: 'commodity', label: 'Brent Crude Oil',         market: 'OANDA' },
    { symbol: 'NATGAS-USD', base: 'NATGAS', quote: 'USD', category: 'commodity', label: 'Natural Gas',             market: 'OANDA' },
    { symbol: 'COPPER-USD', base: 'COPPER', quote: 'USD', category: 'commodity', label: 'Copper',                  market: 'OANDA' },
    { symbol: 'WHEAT-USD',  base: 'WHEAT',  quote: 'USD', category: 'commodity', label: 'Wheat',                   market: 'OANDA' },
    { symbol: 'CORN-USD',   base: 'CORN',   quote: 'USD', category: 'commodity', label: 'Corn',                    market: 'OANDA' },
];

const CATEGORY_LABELS: Record<AssetCategory, string> = {
    crypto: 'Crypto',
    stock: 'Stocks',
    etf: 'ETFs',
    forex: 'Forex',
    commodity: 'Commodities',
};

const CATEGORY_ICONS: Record<AssetCategory, string> = {
    crypto: 'fi-rr-coins',
    stock: 'fi-rr-chart-line-up',
    etf: 'fi-rr-chart-pie',
    forex: 'fi-rr-exchange',
    commodity: 'fi-rr-gem',
};

function InstrumentIcon({ instrument }: { instrument: Instrument }) {
    if (instrument.category === 'crypto') {
        return (
            <div className="flex items-center -space-x-1">
                <img
                    src={`https://assets.coincap.io/assets/icons/${instrument.base.toLowerCase()}@2x.png`}
                    alt={instrument.base}
                    className="w-5 h-5 rounded-full"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
            </div>
        );
    }
    const iconMap: Record<AssetCategory, string> = {
        stock: 'fi-rr-chart-line-up',
        etf: 'fi-rr-chart-pie',
        forex: 'fi-rr-exchange',
        commodity: 'fi-rr-gem',
        crypto: 'fi-rr-coins',
    };
    return (
        <div className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center">
            <i className={`fi ${iconMap[instrument.category]} text-[8px] text-neutral-400`} />
        </div>
    );
}

function MarketDataContent({ data }: { data: MarketData }) {
    return (
        <div className="grid grid-cols-2 gap-4">
            {data.MKTCAP ? (
                <div className="space-y-1">
                    <p className="text-[10px] text-neutral-500">Market Cap</p>
                    <p className="font-medium text-sm">${formatLength(data.MKTCAP)}</p>
                </div>
            ) : null}
            {data.SUPPLY ? (
                <div className="space-y-1">
                    <p className="text-[10px] text-neutral-500">Supply</p>
                    <p className="font-medium text-sm">{formatLength(data.SUPPLY)}</p>
                </div>
            ) : null}
            <div className="space-y-1">
                <p className="text-[10px] text-neutral-500">24h Change</p>
                <p className={`font-medium text-sm ${(data.CHANGEPCT24HOUR ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(data.CHANGEPCT24HOUR ?? 0).toFixed(2)}%
                </p>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] text-neutral-500">24h High / Low</p>
                <p className="font-medium text-sm">
                    {data.HIGH24HOUR ? `$${formatLength(data.HIGH24HOUR)}` : '—'} / {data.LOW24HOUR ? `$${formatLength(data.LOW24HOUR)}` : '—'}
                </p>
            </div>
            {data.VOLUME24HOUR ? (
                <div className="space-y-1 col-span-2">
                    <p className="text-[10px] text-neutral-500">24h Volume</p>
                    <p className="font-medium text-sm">${formatLength(data.VOLUME24HOUR)}</p>
                </div>
            ) : null}
        </div>
    );
}

async function fetchInstrumentPrice(instrument: Instrument): Promise<MarketData | null> {
    const { category, base, quote } = instrument;

    if (category === 'crypto') {
        try {
            const data = (await get(endpoints.crypto.price, { fsyms: base, tsyms: quote })) as PriceMultiFullResponse | undefined;
            const rawData = data?.RAW?.[base]?.[quote];
            if (!rawData) return null;
            return {
                BASE: base, QUOTE: quote,
                PRICE: rawData.PRICE,
                CHANGEPCT24HOUR: rawData.CHANGEPCT24HOUR,
                MARKET: rawData.MARKET,
                MKTCAP: rawData.MKTCAP,
                SUPPLY: rawData.SUPPLY,
                HIGH24HOUR: rawData.HIGH24HOUR,
                LOW24HOUR: rawData.LOW24HOUR,
                VOLUME24HOUR: rawData.VOLUME24HOUR,
                FUNDING: rawData.FUNDING,
                category, label: instrument.label,
            };
        } catch {
            return null;
        }
    }

    const params: Record<string, string> = { category };
    if (category === 'forex') {
        params.from = base;
        params.to = quote;
    } else {
        // stock, etf, commodity — pass as Finnhub symbol
        params.symbol = `OANDA:${base}_${quote}`;
        if (category === 'stock' || category === 'etf') {
            params.symbol = base;
        }
    }

    try {
        const res = await get<PriceResponse>(endpoints.prices.quote, params);
        if (!res || !res.price) return null;
        return {
            BASE: base, QUOTE: quote,
            PRICE: res.price,
            CHANGEPCT24HOUR: res.changePct24h,
            HIGH24HOUR: res.high24h ?? undefined,
            LOW24HOUR: res.low24h ?? undefined,
            VOLUME24HOUR: res.volume24h ?? undefined,
            MARKET: instrument.market,
            category, label: instrument.label,
        };
    } catch {
        return null;
    }
}

const PairBanner = ({ setSymbol }: { setSymbol: (symbol: MarketData) => void }) => {
    const [selectedInstrument, setSelectedInstrument] = useState<Instrument>(AVAILABLE_INSTRUMENTS[0]);
    const [activeCategory, setActiveCategory] = useState<AssetCategory>('crypto');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [marketData, setMarketData] = useState<MarketData | null>(null);
    const [priceStatus, setPriceStatus] = useState<PriceStatus>('loading');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredInstruments = AVAILABLE_INSTRUMENTS.filter((ins) => {
        const matchCategory = ins.category === activeCategory;
        if (!matchCategory) return false;
        if (searchQuery.length === 0) return true;
        const q = searchQuery.toLowerCase();
        return ins.symbol.toLowerCase().includes(q)
            || ins.label.toLowerCase().includes(q)
            || ins.base.toLowerCase().includes(q);
    });

    const loadPrice = useCallback(async (instrument: Instrument) => {
        const data = await fetchInstrumentPrice(instrument);
        if (data) {
            setMarketData(data);
            setPriceStatus('ok');
            setSymbol(data);
            saveItem('symbols', JSON.stringify(data));
        } else {
            // Keep stale data if we have it; only flip to unavailable if nothing cached yet
            setPriceStatus('unavailable');
        }
    }, [setSymbol]);

    useEffect(() => {
        // Reset to loading state when switching instruments
        setPriceStatus('loading');
        setMarketData(null);

        let cancelled = false;
        const startTimer = window.setTimeout(() => {
            void (async () => {
                if (!cancelled) await loadPrice(selectedInstrument);
            })();
        }, 0);
        // Poll at 90 s — comfortably inside the 120 s backend cache window so
        // repeat requests always hit KV rather than the upstream API.
        const intervalId = window.setInterval(() => {
            if (!cancelled) void loadPrice(selectedInstrument);
        }, 90000);

        return () => {
            cancelled = true;
            window.clearTimeout(startTimer);
            window.clearInterval(intervalId);
        };
    }, [selectedInstrument, loadPrice]);

    const handleSelect = (instrument: Instrument) => {
        setSelectedInstrument(instrument);
        setIsDropdownOpen(false);
        setSearchQuery('');
    };

    // ── Loading skeleton ──────────────────────────────────────────────────
    if (priceStatus === 'loading' && !marketData) {
        return (
            <div className="w-full gradient-background p-4 rounded-lg animate-pulse min-h-[72px] flex items-center gap-4">
                <div className="w-5 h-5 rounded-full bg-neutral-800" />
                <div className="h-4 w-24 rounded bg-neutral-800" />
                <div className="h-4 w-16 rounded bg-neutral-800 ml-auto" />
            </div>
        );
    }

    // ── Price unavailable (no data at all) ────────────────────────────────
    if (priceStatus === 'unavailable' && !marketData) {
        return (
            <>
                <div className="w-full gradient-background p-4 rounded-lg">
                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={() => setIsDropdownOpen(true)}
                            className="flex items-center space-x-2 hover:opacity-80"
                        >
                            <InstrumentIcon instrument={selectedInstrument} />
                            <span className="text-sm font-bold">{selectedInstrument.base}/{selectedInstrument.quote}</span>
                            <span className="text-[10px] text-neutral-500 px-1.5 py-0.5 rounded bg-neutral-800">
                                {CATEGORY_LABELS[selectedInstrument.category]}
                            </span>
                            <i className="fi fi-rr-angle-down text-xs" />
                        </button>
                        <div className="flex items-center gap-2 text-amber-400">
                            <i className="fi fi-rr-triangle-warning text-xs" />
                            <span className="text-xs">Price unavailable at this time</span>
                        </div>
                    </div>
                </div>

                {/* Instrument selector still accessible */}
                <InstrumentSelectorModal
                    isOpen={isDropdownOpen}
                    onClose={() => { setIsDropdownOpen(false); setSearchQuery(''); }}
                    filteredInstruments={filteredInstruments}
                    selectedInstrument={selectedInstrument}
                    activeCategory={activeCategory}
                    searchQuery={searchQuery}
                    onSearch={setSearchQuery}
                    onCategoryTab={(cat) => { setActiveCategory(cat); setSearchQuery(''); }}
                    onSelect={handleSelect}
                />
            </>
        );
    }

    if (!marketData) return null;

    const changePct = marketData.CHANGEPCT24HOUR ?? 0;
    const isUp = changePct >= 0;

    return (
        <>
            <div className="w-full gradient-background p-4 rounded-lg relative">
                {/* Price unavailable badge — shows on polling failure while stale data is still displayed */}
                {priceStatus === 'unavailable' && (
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5">
                        <i className="fi fi-rr-triangle-warning text-[10px]" />
                        <span className="text-[10px]">Price unavailable at this time</span>
                    </div>
                )}

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="border-r-0 md:border-r border-neutral-700/30 space-y-1 px-0 md:px-4 w-full md:w-auto">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => setIsDropdownOpen(true)}
                                    className="flex items-center space-x-2 hover:opacity-80"
                                    aria-label="Select instrument"
                                >
                                    <InstrumentIcon instrument={selectedInstrument} />
                                    <span className="text-sm font-bold">
                                        {selectedInstrument.base}/{selectedInstrument.quote}
                                    </span>
                                    <span className="text-[10px] text-neutral-500 px-1.5 py-0.5 rounded bg-neutral-800">
                                        {CATEGORY_LABELS[selectedInstrument.category]}
                                    </span>
                                    <i className="fi fi-rr-angle-down text-xs transition-all duration-300" />
                                </button>

                                <span className={`text-sm font-medium ${priceStatus === 'unavailable' ? 'text-neutral-500' : isUp ? 'text-green-500' : 'text-red-500'}`}>
                                    ${marketData.PRICE?.toLocaleString()}
                                    {priceStatus === 'unavailable' && <span className="text-[9px] ml-1">(stale)</span>}
                                </span>
                            </div>

                            <button
                                className="md:hidden p-2! hover:bg-neutral-800/50 rounded-full! smooth gradient-background"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <i className="fi fi-rr-info text-neutral-500" />
                            </button>
                        </div>
                        <div className="text-xs text-neutral-500">
                            {marketData.MARKET ?? selectedInstrument.label}
                        </div>
                    </div>

                    {/* Desktop stats */}
                    <div className="w-full md:w-auto hidden md:block">
                        <div className="flex justify-between items-center">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:items-center gap-2 md:gap-6 lg:gap-10 w-full">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-neutral-500">24h Change</p>
                                    <p className={`font-medium lg:text-sm text-xs ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                                        {isUp ? '+' : ''}{changePct.toFixed(2)}%
                                    </p>
                                </div>
                                {marketData.HIGH24HOUR ? (
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-neutral-500">24h High</p>
                                        <p className="font-medium lg:text-sm text-xs">${formatLength(marketData.HIGH24HOUR)}</p>
                                    </div>
                                ) : null}
                                {marketData.LOW24HOUR ? (
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-neutral-500">24h Low</p>
                                        <p className="font-medium lg:text-sm text-xs">${formatLength(marketData.LOW24HOUR)}</p>
                                    </div>
                                ) : null}
                                {marketData.MKTCAP ? (
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-neutral-500">Mkt Cap</p>
                                        <p className="font-medium lg:text-sm text-xs">${formatLength(marketData.MKTCAP)}</p>
                                    </div>
                                ) : null}
                                {marketData.VOLUME24HOUR ? (
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-neutral-500">24h Volume</p>
                                        <p className="font-medium lg:text-sm text-xs">${formatLength(marketData.VOLUME24HOUR)}</p>
                                    </div>
                                ) : null}
                            </div>
                            <div className="p-2 md:p-4">
                                <button className="hover:rounded-full p-2 hover:bg-neutral-800/50 smooth">
                                    <i className="fi fi-rr-settings text-neutral-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`${selectedInstrument.base}/${selectedInstrument.quote} Market Data`}>
                <MarketDataContent data={marketData} />
            </Modal>

            <InstrumentSelectorModal
                isOpen={isDropdownOpen}
                onClose={() => { setIsDropdownOpen(false); setSearchQuery(''); }}
                filteredInstruments={filteredInstruments}
                selectedInstrument={selectedInstrument}
                activeCategory={activeCategory}
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                onCategoryTab={(cat) => { setActiveCategory(cat); setSearchQuery(''); }}
                onSelect={handleSelect}
            />
        </>
    );
};

// ── Extracted modal to avoid duplication ──────────────────────────────────────

function InstrumentSelectorModal({
    isOpen, onClose, filteredInstruments, selectedInstrument,
    activeCategory, searchQuery, onSearch, onCategoryTab, onSelect,
}: {
    isOpen: boolean;
    onClose: () => void;
    filteredInstruments: Instrument[];
    selectedInstrument: Instrument;
    activeCategory: AssetCategory;
    searchQuery: string;
    onSearch: (q: string) => void;
    onCategoryTab: (cat: AssetCategory) => void;
    onSelect: (ins: Instrument) => void;
}) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Instrument">
            <div className="space-y-3">
                <div className="relative">
                    <i className="fi fi-rr-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs" />
                    <input
                        type="text"
                        placeholder="Search instruments…"
                        value={searchQuery}
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-600 outline-none"
                    />
                </div>

                <div className="flex gap-1 flex-wrap">
                    {(Object.keys(CATEGORY_LABELS) as AssetCategory[]).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => onCategoryTab(cat)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${activeCategory === cat ? 'bg-green-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                        >
                            <i className={`fi ${CATEGORY_ICONS[cat]} text-[10px]`} />
                            {CATEGORY_LABELS[cat]}
                        </button>
                    ))}
                </div>

                <div className="space-y-1 max-h-[55vh] overflow-y-auto scrollbar-none">
                    {filteredInstruments.length === 0 ? (
                        <div className="text-center text-neutral-600 text-xs py-6">No instruments found</div>
                    ) : (
                        filteredInstruments.map((ins) => (
                            <button
                                key={ins.symbol}
                                onClick={() => onSelect(ins)}
                                className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group smooth ${selectedInstrument.symbol === ins.symbol ? 'bg-green-500/10 border border-green-500/20' : 'hover:bg-neutral-800/50'}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <InstrumentIcon instrument={ins} />
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{ins.base}/{ins.quote}</span>
                                            {ins.market && (
                                                <span className="text-[9px] text-neutral-600 bg-neutral-800 px-1.5 py-0.5 rounded">{ins.market}</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-neutral-500">{ins.label}</span>
                                    </div>
                                </div>
                                {selectedInstrument.symbol === ins.symbol
                                    ? <i className="fi fi-rr-check text-green-500 text-xs" />
                                    : <i className="fi fi-rr-angle-right text-neutral-600 opacity-0 group-hover:opacity-100 smooth text-xs" />
                                }
                            </button>
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
}

export default PairBanner;
