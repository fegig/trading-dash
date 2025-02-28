import OrderBook from '../components/dashboard/OrderBook';
import OrderForm from '../components/dashboard/OrderForm';
import ChartArea from '../components/dashboard/ChartArea';
import PairBanner, { MarketData } from '../components/dashboard/PairBanner';
import { useState } from 'react';
import MiniTradeHistory from '../components/dashboard/MiniTradeHistory';
import Modal from '../components/common/Modal';

const Home = () => {
 const [symbol, setSymbol] = useState<MarketData | null>(null);
 const [isOrderBookModalOpen, setIsOrderBookModalOpen] = useState(false);
 const [isOrderFormModalOpen, setIsOrderFormModalOpen] = useState(false);

    return (
        <div className="relative">
            <main className="p-6 grid grid-cols-12 lg:gap-6 gap-3">
                <div className='col-span-8 space-y-4 max-lg:col-span-full'>
                    <PairBanner setSymbol={setSymbol} />
                    <ChartArea symbol={symbol || {
                        BASE: "BTC", 
                        QUOTE: "USDT"
                    }} />
                    <MiniTradeHistory/>
                </div>
         
                <div className="col-span-4 space-x-4 hidden justify-between lg:flex">
                    <OrderBook symbol={symbol || {
                        BASE: "BTC", 
                        QUOTE: "USDT"
                    }} />
                    <OrderForm symbol={symbol || null}/>
                </div>
            </main>

            {/* Mobile Floating Action Buttons */}
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

            {/* Order Book Modal (Bottom Sheet Style) */}
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

            {/* Order Form Modal (Bottom Sheet Style) */}
            <Modal
                isOpen={isOrderFormModalOpen}
                onClose={() => setIsOrderFormModalOpen(false)}
                title="Place Order"
                className="max-w-full w-full rounded-b-none rounded-t-xl fixed bottom-0 top-auto max-h-[80vh]"
            >
                <div className="h-[70vh]">
                    <OrderForm symbol={symbol || null} />
                </div>
            </Modal>
        </div>
    );
};

export default Home;