import OrderBook from '../components/dashboard/OrderBook';
import OrderForm from '../components/dashboard/OrderForm';
import ChartArea from '../components/dashboard/ChartArea';
import PairBanner, { MarketData } from '../components/dashboard/PairBanner';
import { useState } from 'react';


const Home = () => {
 const [symbol, setSymbol] = useState<MarketData | null>(null);
    return (

        <main className="p-6 grid grid-cols-12 gap-6">
   
            <div className='col-span-8 space-y-4'>

            <PairBanner setSymbol={setSymbol} />
            <ChartArea />
            </div>
         


            <div className="col-span-4 space-x-4 flex justify-between">

                <OrderBook />
                <OrderForm symbol={symbol || null}/>




            </div>
           
        </main>


    );
};

export default Home;