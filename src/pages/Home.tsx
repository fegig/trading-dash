import OrderBook from '../components/dashboard/OrderBook';
import OrderForm from '../components/dashboard/OrderForm';
import ChartArea from '../components/dashboard/ChartArea';
import PairBanner, { MarketData } from '../components/dashboard/PairBanner';
import { useState } from 'react';
import MiniTradeHistory from '../components/dashboard/MiniTradeHistory';


const Home = () => {
 const [symbol, setSymbol] = useState<MarketData >();
    return (

        <main className="p-6 grid grid-cols-12 gap-6">
   
            <div className='col-span-8 space-y-4'>

            <PairBanner setSymbol={setSymbol} />
            <ChartArea symbol={symbol || {
                BASE: "BTC", 
                QUOTE: "USDT"

            }} />
            <MiniTradeHistory/>
            </div>
         


            <div className="col-span-4 space-x-4 flex justify-between">

                <OrderBook symbol={symbol || {
                    BASE: "BTC", 
                    QUOTE: "USDT"
                }} />
                <OrderForm symbol={symbol || null}/>




            </div>
           
        </main>


    );
};

export default Home;