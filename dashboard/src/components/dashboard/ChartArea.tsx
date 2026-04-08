import { useEffect, useRef, useState } from "react";
import { CoinData, CoinReturn, getCoinById, getInstrumentHistory } from "@/services/CryptoService";
import CustomChartWidget from "../common/CustomChartWidget";
import { MarketData } from "./PairBanner";
import Modal from "../common/Modal";
import { ChartType, Filters } from "@/types/chat";
import type { BookEntry, DealEntry } from "@/types/trading";
import { get } from "@/util/request";
import { endpoints } from "@/services/endpoints";
import { post } from "@/util/request";
import { formatCurrency, formatNumber } from "@/util/formatCurrency";

interface PendingOrder {
    id: string;
    pair: string;
    side: 'buy' | 'sell';
    orderType: 'market' | 'limit' | 'stop';
    amount: string;
    leverage: number;
    price: string | null;
    marginType: 'isolated' | 'cross';
    status: 'open' | 'filled' | 'cancelled';
    createdAt: number;
}

// --- Depth chart ---

function DepthChart({ asks, bids }: { asks: BookEntry[]; bids: BookEntry[] }) {
    if (asks.length === 0 && bids.length === 0) {
        return (
            <div className="flex items-center justify-center h-[250px] text-neutral-600 text-sm">
                Waiting for order book data…
            </div>
        );
    }

    const sliced = 30;
    const bidSlice = [...bids].slice(0, sliced).reverse();
    const askSlice = [...asks].slice(0, sliced);

    const bidPoints = bidSlice.reduce<{ price: number; cum: number }[]>((acc, b) => {
        const cum = (acc[acc.length - 1]?.cum ?? 0) + b.quantity;
        return [...acc, { price: b.price, cum }];
    }, []);
    const askPoints = askSlice.reduce<{ price: number; cum: number }[]>((acc, a) => {
        const cum = (acc[acc.length - 1]?.cum ?? 0) + a.quantity;
        return [...acc, { price: a.price, cum }];
    }, []);

    const allCum = [...bidPoints.map(p => p.cum), ...askPoints.map(p => p.cum)];
    const maxCum = Math.max(...allCum, 1);
    const allPrices = [...bidPoints.map(p => p.price), ...askPoints.map(p => p.price)];
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice || 1;

    const W = 600;
    const H = 220;
    const pad = 8;

    const px = (price: number) => pad + ((price - minPrice) / priceRange) * (W - pad * 2);
    const py = (cum: number) => H - pad - (cum / maxCum) * (H - pad * 2);

    const buildPath = (points: { price: number; cum: number }[]): string => {
        if (points.length === 0) return '';
        const parts = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(p.price).toFixed(1)} ${py(p.cum).toFixed(1)}`);
        const last = points[points.length - 1];
        return [...parts, `L ${px(last.price).toFixed(1)} ${H - pad}`, `L ${px(points[0].price).toFixed(1)} ${H - pad}`, 'Z'].join(' ');
    };

    const bidPath = buildPath(bidPoints);
    const askPath = buildPath(askPoints);

    const midPrice = bidSlice.length && askSlice.length
        ? (bidSlice[bidSlice.length - 1].price + askSlice[0].price) / 2
        : null;

    return (
        <div className="w-full h-[250px] relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="bidGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
                    </linearGradient>
                    <linearGradient id="askGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
                    </linearGradient>
                </defs>
                {bidPath && <path d={bidPath} fill="url(#bidGrad)" stroke="#22c55e" strokeWidth="1.5" />}
                {askPath && <path d={askPath} fill="url(#askGrad)" stroke="#ef4444" strokeWidth="1.5" />}
                {midPrice != null && (
                    <line
                        x1={px(midPrice).toFixed(1)} y1={pad}
                        x2={px(midPrice).toFixed(1)} y2={H - pad}
                        stroke="#a3a3a3" strokeWidth="1" strokeDasharray="4 3"
                    />
                )}
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 pb-1 text-[9px] text-neutral-600">
                <span>{formatNumber(minPrice, 2)}</span>
                {midPrice != null && <span className="text-neutral-400">{formatNumber(midPrice, 2)}</span>}
                <span>{formatNumber(maxPrice, 2)}</span>
            </div>
            <div className="absolute top-1 right-2 flex gap-3 text-[9px]">
                <span className="text-green-500">● Bids</span>
                <span className="text-red-500">● Asks</span>
            </div>
        </div>
    );
}

// --- Pending orders tab ---

function PendingTab({ pair }: { pair: string }) {
    const [orders, setOrders] = useState<PendingOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            setLoading(true);
            try {
                const res = await get<{ orders: PendingOrder[] }>(endpoints.live.openOrders(pair));
                if (!cancelled) setOrders(res?.orders ?? []);
            } catch {
                if (!cancelled) setOrders([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [pair]);

    const handleCancel = async (orderId: string) => {
        await post(endpoints.live.cancelOrder, { orderId, pair });
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[250px]">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500" />
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[250px] gap-2 text-neutral-600">
                <i className="fi fi-rr-hourglass text-2xl" />
                <span className="text-sm">No pending orders for {pair}</span>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto h-[250px] overflow-y-auto scrollbar-none">
            <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-neutral-950">
                    <tr className="text-neutral-500 border-b border-neutral-800">
                        <th className="text-left py-2 pr-3">Side</th>
                        <th className="text-left py-2 pr-3">Type</th>
                        <th className="text-right py-2 pr-3">Price</th>
                        <th className="text-right py-2 pr-3">Amount</th>
                        <th className="text-right py-2">Lev</th>
                        <th className="py-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((o) => (
                        <tr key={o.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/30">
                            <td className={`py-1.5 pr-3 font-medium capitalize ${o.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>{o.side}</td>
                            <td className="py-1.5 pr-3 text-neutral-400 capitalize">{o.orderType}</td>
                            <td className="py-1.5 pr-3 text-right text-neutral-300">{o.price ? formatNumber(Number(o.price), 2) : 'Market'}</td>
                            <td className="py-1.5 pr-3 text-right text-neutral-300">{formatNumber(Number(o.amount), 4)}</td>
                            <td className="py-1.5 text-right text-neutral-400">{o.leverage}×</td>
                            <td className="py-1.5 pl-2">
                                <button
                                    onClick={() => void handleCancel(o.id)}
                                    className="text-red-500 hover:text-red-400 text-[10px] px-1.5 py-0.5 rounded border border-red-500/30 hover:border-red-400/50"
                                >
                                    Cancel
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// --- Deals tab ---

function DealsTab({ deals, quote }: { deals: DealEntry[]; quote: string }) {
    if (deals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[250px] gap-2 text-neutral-600">
                <i className="fi fi-rr-chart-candlestick text-2xl" />
                <span className="text-sm">No recent fills — place an order to see deals here</span>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto h-[250px] overflow-y-auto scrollbar-none">
            <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-neutral-950">
                    <tr className="text-neutral-500 border-b border-neutral-800">
                        <th className="text-left py-2 pr-3">Pair</th>
                        <th className="text-left py-2 pr-3">Side</th>
                        <th className="text-right py-2 pr-3">Fill Price ({quote})</th>
                        <th className="text-right py-2">Time</th>
                    </tr>
                </thead>
                <tbody>
                    {deals.map((d) => (
                        <tr key={`${d.orderId}-${d.ts}`} className="border-b border-neutral-800/50 hover:bg-neutral-900/30">
                            <td className="py-1.5 pr-3 text-neutral-300 font-medium">{d.pair}</td>
                            <td className={`py-1.5 pr-3 capitalize font-medium ${d.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>{d.side}</td>
                            <td className="py-1.5 pr-3 text-right text-neutral-300">{formatCurrency(d.price, 'USD')}</td>
                            <td className="py-1.5 text-right text-neutral-500">{new Date(d.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// --- Last Price tab ---

function LastPriceTab({ price, changePct24h, symbol }: { price?: number; changePct24h?: number; symbol: MarketData }) {
    const historyRef = useRef<number[]>([]);
    const [history, setHistory] = useState<number[]>([]);

    useEffect(() => {
        if (price == null || !Number.isFinite(price)) return;
        const next = [...historyRef.current, price].slice(-30);
        historyRef.current = next;
        setHistory(next);
    }, [price]);

    const pct = changePct24h ?? symbol.CHANGEPCT24HOUR ?? 0;
    const displayPrice = price ?? symbol.PRICE ?? 0;

    const minH = Math.min(...history);
    const maxH = Math.max(...history);
    const hRange = maxH - minH || 1;

    const W = 300;
    const H = 60;

    const sparkPath = history.length > 1
        ? history.map((v, i) => {
            const x = (i / (history.length - 1)) * W;
            const y = H - ((v - minH) / hRange) * H;
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        }).join(' ')
        : '';

    return (
        <div className="h-[250px] flex flex-col justify-center px-4 gap-4">
            <div className="flex items-end gap-3">
                <span className="text-3xl font-bold text-white">
                    {displayPrice > 0 ? formatCurrency(displayPrice, 'USD') : '—'}
                </span>
                <span className={`text-base font-semibold mb-0.5 ${pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                </span>
            </div>

            {sparkPath && (
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14" preserveAspectRatio="none">
                    <path d={sparkPath} fill="none" stroke={pct >= 0 ? '#22c55e' : '#ef4444'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: '24h High', value: symbol.HIGH24HOUR ? formatCurrency(symbol.HIGH24HOUR, 'USD') : '—' },
                    { label: '24h Low', value: symbol.LOW24HOUR ? formatCurrency(symbol.LOW24HOUR, 'USD') : '—' },
                    { label: '24h Vol', value: symbol.VOLUME24HOUR ? `$${(symbol.VOLUME24HOUR / 1e6).toFixed(2)}M` : '—' },
                    { label: 'Market', value: symbol.MARKET ?? symbol.BASE ?? '—' },
                ].map(({ label, value }) => (
                    <div key={label} className="space-y-0.5">
                        <p className="text-[10px] text-neutral-500">{label}</p>
                        <p className="text-xs font-medium text-neutral-200">{value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Main ChartArea ---

interface ChartAreaProps {
    symbol: MarketData;
    asks?: BookEntry[];
    bids?: BookEntry[];
    livePrice?: number;
    changePct24h?: number;
    recentDeals?: DealEntry[];
}

const CRYPTO_BASES = new Set([
    'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'DOT', 'MATIC', 'LINK',
    'AVAX', 'UNI', 'LTC', 'BCH', 'ATOM', 'NEAR', 'FTM', 'ALGO', 'VET', 'ICP',
    'SAND', 'MANA', 'AXS', 'TRX', 'SHIB', 'PEPE', 'TON', 'APT', 'ARB', 'OP',
]);

function ChartArea({ symbol, asks = [], bids = [], livePrice, changePct24h, recentDeals = [] }: ChartAreaProps) {
    const [activeTab, setActiveTab] = useState('depth');
    const [timeFilter, setTimeFilter] = useState<Filters>('1H');
    const [graphData, setGraphData] = useState<CoinReturn>()
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [filteredData, setFilteredData] = useState<CoinData[]>([])
    const [isTabModalOpen, setIsTabModalOpen] = useState(false);
    const [chartType, setChartType] = useState<ChartType>('line');

    const isCrypto = CRYPTO_BASES.has((symbol.BASE ?? '').toUpperCase()) || symbol.category === 'crypto';
    // Use explicit category from MarketData, fall back to heuristic
    const category = symbol.category ?? (isCrypto ? 'crypto' : 'stock');

    useEffect(() => {
        let cancelled = false;
        const timer = window.setTimeout(() => {
            void (async () => {
                setIsLoading(true);
                try {
                    let list: CoinReturn;
                    if (isCrypto) {
                        list = await getCoinById(symbol.BASE || 'BTC', symbol.QUOTE || 'USDT');
                    } else {
                        list = await getInstrumentHistory(category, symbol.BASE || '', symbol.QUOTE || 'USD');
                    }
                    if (cancelled || !list) return;
                    setGraphData(list);
                    setFilteredData(list.hChanges ?? []);
                } catch (error) {
                    console.error('Error fetching instrument history:', error);
                } finally {
                    if (!cancelled) setIsLoading(false);
                }
            })();
        }, 0);
        return () => { cancelled = true; window.clearTimeout(timer); };
    }, [symbol.BASE, symbol.QUOTE, isCrypto, category]);

    const changeGraph = (filter: Filters) => {
        setIsLoading(true);
        setTimeFilter(filter);
        setTimeout(() => {
            const newData = (() => {
                switch (filter) {
                    case "1H": return graphData?.hChanges;
                    case "1D": return graphData?.dChanges;
                    case "1W": return graphData?.wChanges;
                    case "1M": return graphData?.mChanges;
                    case "1Y": return graphData?.yChanges;
                    default: return [];
                }
            })();
            setFilteredData(newData || []);
            setIsLoading(false);
        }, 0);
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab.toLowerCase());
        setIsTabModalOpen(false);
    };

    const handleChartTypeChange = () => {
        setIsLoading(true);
        setTimeout(() => {
            setChartType(prev => prev === 'candlestick' ? 'line' : 'candlestick');
            setTimeout(() => setIsLoading(false), 300);
        }, 200);
    };

    const tabs = ['Depth', 'Pending', 'Deals', 'Last Price'];
    const filters = ['1H', '1D', '1W', '1M', '1Y'] as const;

    const pair = symbol.BASE && symbol.QUOTE
        ? `${symbol.BASE}-${symbol.QUOTE}`.toUpperCase()
        : '';

    // Show the time-filtered OHLCV chart when on the depth tab and history is loaded
    const hasHistory = (filteredData.length > 0) || (graphData != null);
    const isChartTab = activeTab === 'depth' && hasHistory;

    return (
        <div className="gradient-background">
            <div className="flex justify-between items-center p-2 md:p-0">
                {/* Desktop Tabs */}
                <div className="hidden md:flex space-x-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`px-4 py-1 text-sm rounded-full text-neutral-400 ${activeTab === tab.toLowerCase() ? 'bg-green-500 text-neutral-950' : 'hover:bg-neutral-800'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Mobile Tabs Button */}
                <div className="md:hidden flex items-center">
                    <button
                        className="px-3! text-xs lg:text-sm rounded-full! gradient-background p-1.5! flex items-center space-x-2"
                        onClick={() => setIsTabModalOpen(true)}
                    >
                        <span className="capitalize text-xs text-neutral-400">{activeTab}</span>
                        <i className="fi fi-rr-angle-down text-xs text-neutral-400"></i>
                    </button>
                </div>

                {/* Chart filters — only relevant on depth/chart tab */}
                {isChartTab && (
                    <div className="flex space-x-2 gradient-background rounded-full! p-0! justify-between items-center">
                        <button
                            onClick={handleChartTypeChange}
                            className="px-3 text-xs py-1.5 rounded-full bg-green-500 text-neutral-950"
                            aria-label={`Switch to ${chartType === 'candlestick' ? 'line' : 'candlestick'} chart`}
                        >
                            <i className={`fi fi-rr-${chartType === 'candlestick' ? 'chart-line-up' : 'chart-candlestick'}`}></i>
                        </button>
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                onClick={() => changeGraph(filter)}
                                className={`px-3 text-xs py-1 rounded-full text-neutral-400 ${timeFilter === filter ? 'bg-green-500 text-neutral-950' : 'hover:bg-neutral-800'}`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Tab content */}
            <div className="rounded mt-1">
                {activeTab === 'depth' && (
                    filteredData.length > 0 || isLoading ? (
                        <CustomChartWidget
                            chartType={chartType}
                            setChartType={setChartType}
                            setIsLoading={setIsLoading}
                            isLoading={isLoading}
                            data={filteredData}
                            timeFilter={timeFilter}
                        />
                    ) : (
                        <DepthChart asks={asks} bids={bids} />
                    )
                )}

                {activeTab === 'pending' && (
                    <PendingTab pair={pair} />
                )}

                {activeTab === 'deals' && (
                    <DealsTab deals={recentDeals} quote={symbol.QUOTE ?? 'USD'} />
                )}

                {activeTab === 'last price' && (
                    <LastPriceTab price={livePrice} changePct24h={changePct24h} symbol={symbol} />
                )}
            </div>

            {/* Mobile Tab Selection Modal */}
            <Modal
                isOpen={isTabModalOpen}
                onClose={() => setIsTabModalOpen(false)}
                title="Select View"
            >
                <div className="grid grid-cols-1 gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab.toLowerCase())}
                            className={`gradient-background w-full text-left text-xs px-4 py-2! rounded-lg flex items-center justify-between ${activeTab === tab.toLowerCase() ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'hover:bg-neutral-800/50 text-neutral-400'}`}
                        >
                            <span>{tab}</span>
                            {activeTab === tab.toLowerCase() && <i className="fi fi-rr-check text-green-500"></i>}
                        </button>
                    ))}
                </div>
            </Modal>
        </div>
    );
}

export default ChartArea;
