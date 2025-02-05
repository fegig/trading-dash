import OrderBook from '../components/dashboard/OrderBook';
import OrderForm from '../components/dashboard/OrderForm';
import ChartArea from '../components/dashboard/ChartArea';
import PairBanner from '../components/dashboard/PairBanner';


const Home = () => {
 
    return (

        <main className="p-6 grid grid-cols-12 gap-6">
   
            <div className='col-span-8 space-y-4'>

            <PairBanner />
            <ChartArea />
            </div>
         


            <div className="col-span-4 space-x-4 flex justify-between">

                <OrderBook />
                <OrderForm />

            </div>
           
        </main>


    );
};

export default Home;