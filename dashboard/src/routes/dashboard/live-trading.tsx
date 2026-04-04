import OrderBook from '@/components/dashboard/OrderBook';
import OrderForm from '@/components/dashboard/OrderForm';
import ChartArea from '@/components/dashboard/ChartArea';
import PairBanner, { MarketData } from '@/components/dashboard/PairBanner';
import { useEffect, useState } from 'react';
import MiniTradeHistory from '@/components/dashboard/MiniTradeHistory';
import Modal from '@/components/common/Modal';

const TRADING_MODE_KEY = 'td-live-trading-mode';

function readStoredTradingMode(): 'lite' | 'pro' {
    try {
        const v = localStorage.getItem(TRADING_MODE_KEY);
        if (v === 'lite' || v === 'pro') return v;
    } catch {
        /* ignore */
    }
    return 'lite';
}

/** Live spot trading — chart, order book, order form */
function LiveTrading() {
 const [symbol, setSymbol] = useState<MarketData | null>(null);
 const [isOrderBookModalOpen, setIsOrderBookModalOpen] = useState(false);
 const [isOrderFormModalOpen, setIsOrderFormModalOpen] = useState(false);
 const [tradingMode, setTradingMode] = useState<'lite' | 'pro'>(readStoredTradingMode);

 useEffect(() => {
     try {
         localStorage.setItem(TRADING_MODE_KEY, tradingMode);
     } catch {
         /* ignore */
     }
 }, [tradingMode]);

    return (
        <div className="relative">
            <main className="p-6 grid grid-cols-12 lg:gap-6 gap-3">
                <div className='col-span-8 space-y-4 max-lg:col-span-full'>
                    <p className="text-[11px] text-neutral-500 leading-relaxed px-0.5 -mt-1">
                        Market fills use the <span className="text-neutral-400">chart / banner price</span> so entry matches what you see.
                        The book is a visual depth ladder; after you trade it re-aligns to your fill for server-side TP/SL checks.
                    </p>
                    <PairBanner setSymbol={setSymbol} />
                    <ChartArea symbol={symbol || {
                        BASE: "BTC", 
                        QUOTE: "USDT"
                    }} />
                    <MiniTradeHistory/>
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
                            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-colors ${
                                tradingMode === 'lite'
                                    ? 'bg-green-500 text-neutral-950'
                                    : 'text-neutral-500 hover:text-neutral-300'
                            }`}
                        >
                            Lite
                        </button>
                        <button
                            type="button"
                            onClick={() => setTradingMode('pro')}
                            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-colors ${
                                tradingMode === 'pro'
                                    ? 'bg-green-500 text-neutral-950'
                                    : 'text-neutral-500 hover:text-neutral-300'
                            }`}
                        >
                            Pro
                        </button>
                    </div>
                    <div className="flex space-x-4 justify-between flex-1 min-h-0">
                    <OrderBook symbol={symbol || {
                        BASE: "BTC", 
                        QUOTE: "USDT"
                    }} />
                    <OrderForm symbol={symbol || null} tradingMode={tradingMode} />
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
                        symbol={symbol || {
                            BASE: "BTC", 
                            QUOTE: "USDT"
                        }} 
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
                            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-colors ${
                                tradingMode === 'lite'
                                    ? 'bg-green-500 text-neutral-950'
                                    : 'text-neutral-500 hover:text-neutral-300'
                            }`}
                        >
                            Lite
                        </button>
                        <button
                            type="button"
                            onClick={() => setTradingMode('pro')}
                            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-colors ${
                                tradingMode === 'pro'
                                    ? 'bg-green-500 text-neutral-950'
                                    : 'text-neutral-500 hover:text-neutral-300'
                            }`}
                        >
                            Pro
                        </button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        <OrderForm symbol={symbol || null} tradingMode={tradingMode} />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default LiveTrading;
