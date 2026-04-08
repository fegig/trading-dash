import OrderBook from '@/components/dashboard/OrderBook';
import OrderForm from '@/components/dashboard/OrderForm';
import ChartArea from '@/components/dashboard/ChartArea';
import PairBanner, { MarketData } from '@/components/dashboard/PairBanner';
import { useEffect, useRef, useState } from 'react';
import MiniTradeHistory from '@/components/dashboard/MiniTradeHistory';
import Modal from '@/components/common/Modal';
import { liveOrderBookWsUrl } from '@/util/liveWs';
import { dispatchTradesRefresh } from '@/util/tradeRefreshEvents';
import type { BookEntry, DealEntry } from '@/types/trading';

const TRADING_MODE_KEY = 'td-live-trading-mode';

const DEFAULT_ASKS: BookEntry[] = [
    { price: 43300.75, quantity: 0.315 },
    { price: 43275.5, quantity: 1.12 },
    { price: 43250.25, quantity: 0.4235 },
    { price: 43225.5, quantity: 1.21 },
    { price: 43200.75, quantity: 0.875 },
    { price: 43175.0, quantity: 2.1 },
    { price: 43150.25, quantity: 1.55 },
    { price: 43125.75, quantity: 0.93 },
    { price: 43100.5, quantity: 1.64 },
    { price: 43075.25, quantity: 0.78 },
];

const DEFAULT_BIDS: BookEntry[] = [
    { price: 43050.0, quantity: 1.89 },
    { price: 43025.75, quantity: 0.925 },
    { price: 43000.5, quantity: 1.34 },
    { price: 42975.25, quantity: 2.45 },
    { price: 42950.0, quantity: 0.68 },
    { price: 42925.75, quantity: 1.23 },
    { price: 42900.5, quantity: 0.89 },
    { price: 42875.25, quantity: 1.76 },
    { price: 42850.0, quantity: 0.54 },
    { price: 42825.75, quantity: 1.42 },
];

function useLiveTradingWs(pair: string | null) {
    const [asks, setAsks] = useState<BookEntry[]>(DEFAULT_ASKS);
    const [bids, setBids] = useState<BookEntry[]>(DEFAULT_BIDS);
    const [price, setPrice] = useState<number | null>(null);
    const [changePct24h, setChangePct24h] = useState<number | null>(null);
    const dealsRef = useRef<DealEntry[]>([]);
    const [recentDeals, setRecentDeals] = useState<DealEntry[]>([]);
    const [wsConnected, setWsConnected] = useState(false);

    useEffect(() => {
        if (!pair) return;

        let cancelled = false;
        let ws: WebSocket | null = null;
        let pingId: number | null = null;
        let reconnectTimer: number | null = null;

        const clearPing = () => {
            if (pingId != null) { clearInterval(pingId); pingId = null; }
        };

        const scheduleReconnect = () => {
            if (cancelled || reconnectTimer != null) return;
            reconnectTimer = window.setTimeout(() => { reconnectTimer = null; connect(); }, 3000);
        };

        const connect = () => {
            if (cancelled) return;
            try {
                ws = new WebSocket(liveOrderBookWsUrl(pair));
            } catch {
                scheduleReconnect();
                return;
            }

            ws.onopen = () => {
                if (!cancelled) setWsConnected(true);
                clearPing();
                pingId = window.setInterval(() => {
                    if (ws?.readyState === WebSocket.OPEN) {
                        try { ws.send(JSON.stringify({ type: 'ping' })); } catch { /* ignore */ }
                    }
                }, 25000);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data as string) as {
                        type?: string;
                        asks?: BookEntry[];
                        bids?: BookEntry[];
                        price?: number;
                        changePct24h?: number;
                        orderId?: string;
                        pair?: string;
                        side?: 'buy' | 'sell';
                    };

                    if (data.type === 'snapshot' || data.type === 'book_update' || data.type === 'order_filled') {
                        if (Array.isArray(data.asks) && data.asks.length > 0) setAsks(data.asks);
                        if (Array.isArray(data.bids) && data.bids.length > 0) setBids(data.bids);
                        if (typeof data.price === 'number' && Number.isFinite(data.price)) setPrice(data.price);
                        if (typeof data.changePct24h === 'number' && Number.isFinite(data.changePct24h)) setChangePct24h(data.changePct24h);
                    }

                    if (data.type === 'order_filled') {
                        const deal: DealEntry = {
                            orderId: data.orderId ?? crypto.randomUUID(),
                            pair: data.pair ?? pair,
                            side: data.side ?? 'buy',
                            price: data.price ?? 0,
                            ts: Date.now(),
                        };
                        const updated = [deal, ...dealsRef.current].slice(0, 20);
                        dealsRef.current = updated;
                        setRecentDeals(updated);
                        dispatchTradesRefresh();
                    }

                    if (data.type === 'trade_closed') {
                        dispatchTradesRefresh();
                    }
                } catch { /* ignore malformed */ }
            };

            ws.onerror = () => { try { ws?.close(); } catch { /* ignore */ } };
            ws.onclose = () => { clearPing(); ws = null; if (!cancelled) { setWsConnected(false); scheduleReconnect(); } };
        };

        connect();

        return () => {
            cancelled = true;
            setWsConnected(false);
            if (reconnectTimer != null) { clearTimeout(reconnectTimer); reconnectTimer = null; }
            clearPing();
            ws?.close();
        };
    }, [pair]);

    return { asks, bids, price, changePct24h, recentDeals, wsConnected };
}

function readStoredTradingMode(): 'lite' | 'pro' {
    try {
        const v = localStorage.getItem(TRADING_MODE_KEY);
        if (v === 'lite' || v === 'pro') return v;
    } catch { /* ignore */ }
    return 'lite';
}

/** Live spot trading — chart, order book, order form */
function LiveTrading() {
    const [symbol, setSymbol] = useState<MarketData | null>(null);
    const [isOrderBookModalOpen, setIsOrderBookModalOpen] = useState(false);
    const [isOrderFormModalOpen, setIsOrderFormModalOpen] = useState(false);
    const [tradingMode, setTradingMode] = useState<'lite' | 'pro'>(readStoredTradingMode);

    useEffect(() => {
        try { localStorage.setItem(TRADING_MODE_KEY, tradingMode); } catch { /* ignore */ }
    }, [tradingMode]);

    const pair = symbol?.BASE && symbol?.QUOTE
        ? `${symbol.BASE}-${symbol.QUOTE}`.toUpperCase()
        : null;

    const { asks, bids, price, changePct24h, recentDeals, wsConnected } = useLiveTradingWs(pair);

    const effectiveSymbol: MarketData = symbol ?? { BASE: 'BTC', QUOTE: 'USDT' };

    return (
        <div className="relative">
            <main className="grid grid-cols-12 lg:gap-6 gap-3">
                <div className='col-span-8 space-y-4 max-lg:col-span-full'>
                    <div className="flex items-center justify-between px-0.5 -mt-1">
                        <p className="text-[11px] text-neutral-500 leading-relaxed">
                            Market fills use the <span className="text-neutral-400">chart / banner price</span> so entry matches what you see.
                            The book is a visual depth ladder; after you trade it re-aligns to your fill for server-side TP/SL checks.
                        </p>
                        {pair ? (
                            <span className={`ml-3 shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${wsConnected ? 'bg-green-500/15 text-green-400' : 'bg-neutral-800 text-neutral-500'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-neutral-600'}`} />
                                {wsConnected ? 'Live' : 'Connecting…'}
                            </span>
                        ) : null}
                    </div>
                    <PairBanner setSymbol={setSymbol} />
                    <ChartArea
                        symbol={effectiveSymbol}
                        asks={asks}
                        bids={bids}
                        livePrice={price ?? undefined}
                        changePct24h={changePct24h ?? undefined}
                        recentDeals={recentDeals}
                    />
                    <MiniTradeHistory />
                </div>

                <div className="col-span-4 hidden lg:flex flex-col gap-3 min-h-0">
                    <div
                        className="flex rounded-full gradient-background p-0.5 shrink-0"
                        role="group"
                        aria-label="Trading mode"
                    >
                        <button
                            type="button"
                            onClick={() => setTradingMode('lite')}
                            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-colors ${tradingMode === 'lite' ? 'bg-green-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            Lite
                        </button>
                        <button
                            type="button"
                            onClick={() => setTradingMode('pro')}
                            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-colors ${tradingMode === 'pro' ? 'bg-green-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            Pro
                        </button>
                    </div>
                    <div className="flex space-x-4 justify-between flex-1 min-h-0">
                        <OrderBook
                            symbol={effectiveSymbol}
                            asks={asks}
                            bids={bids}
                            price={price ?? undefined}
                            changePct24h={changePct24h ?? undefined}
                        />
                        <OrderForm symbol={symbol ?? null} tradingMode={tradingMode} />
                    </div>
                </div>
            </main>

            <div className="fixed bottom-14 right-4 flex flex-col space-y-3 z-20 lg:hidden">
                <button
                    onClick={() => setIsOrderFormModalOpen(true)}
                    className="w-10 h-10 rounded-full bg-green-500 shadow-lg shadow-green-500/50 flex items-center justify-center hover:bg-green-600 transition-all"
                    aria-label="Place Order"
                >
                    <i className="fi fi-rr-exchange text-sm text-neutral-950"></i>
                </button>
                <button
                    onClick={() => setIsOrderBookModalOpen(true)}
                    className="w-10 h-10 rounded-full bg-neutral-800 shadow-lg shadow-black/50 flex items-center justify-center hover:bg-neutral-700 transition-all"
                    aria-label="Order Book"
                >
                    <i className="fi fi-rr-book text-sm text-green-400"></i>
                </button>
            </div>

            <Modal
                isOpen={isOrderBookModalOpen}
                onClose={() => setIsOrderBookModalOpen(false)}
                title="Order Book"
                className="max-w-full w-full rounded-b-none rounded-t-xl fixed bottom-0 top-auto max-h-[80vh]"
            >
                <div className="h-[70vh]">
                    <OrderBook
                        symbol={effectiveSymbol}
                        asks={asks}
                        bids={bids}
                        price={price ?? undefined}
                        changePct24h={changePct24h ?? undefined}
                    />
                </div>
            </Modal>

            <Modal
                isOpen={isOrderFormModalOpen}
                onClose={() => setIsOrderFormModalOpen(false)}
                title="Place Order"
                className="max-w-full w-full rounded-b-none rounded-t-xl fixed bottom-0 top-auto max-h-[80vh]"
            >
                <div className="h-[70vh] flex flex-col min-h-0">
                    <div
                        className="flex rounded-full gradient-background p-0.5 shrink-0 mb-3 lg:hidden"
                        role="group"
                        aria-label="Trading mode"
                    >
                        <button
                            type="button"
                            onClick={() => setTradingMode('lite')}
                            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-colors ${tradingMode === 'lite' ? 'bg-green-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            Lite
                        </button>
                        <button
                            type="button"
                            onClick={() => setTradingMode('pro')}
                            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-colors ${tradingMode === 'pro' ? 'bg-green-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            Pro
                        </button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        <OrderForm symbol={symbol ?? null} tradingMode={tradingMode} />
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default LiveTrading;
