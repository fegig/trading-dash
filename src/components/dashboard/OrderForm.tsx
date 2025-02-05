import { useState } from "react";

type TradingType = 'isolated' | 'multiplied';
type LongShort = 'long' | 'short';
type OrderType = 'market' | 'limit' | 'stop';



function OrderForm() {

    const [tradingType, setTradingType] = useState<TradingType>('isolated');
    const [tradingTypeValue, setTradingTypeValue] = useState<number>(0);
    const [orderType, setOrderType] = useState<OrderType>('market');
    const [longShort, setLongShort] = useState<LongShort>('long');


    const [leverage, setLeverage] = useState(2);
    const [orderPrice, setOrderPrice] = useState('');
    const [triggerPrice, setTriggerPrice] = useState('');
    const [amount, setAmount] = useState('');

    return (
        <div className="gradient-background p-4 space-y-4">

            <div className="border-b border-neutral-500/30 space-y-4 pb-4">


                <div className="flex items-center justify-between gradient-background !rounded-full !p-0">
                    <div className="flex-1 max-w-[50%]">
                        <select className="w-full outline-0 border-0 px-3 py-2 text-neutral-500 capitalize text-xs text-center"
                            onChange={(e) => setTradingType(e.target.value as TradingType)}>
                            {['isolated', 'multiplied'].map((type) => (
                                <option value={type} key={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 max-w-[50%]">
                        <input
                            type="number"
                            onChange={(e)=>setTradingTypeValue(Number(e.target.value))}
                            className="w-full text-neutral-500 font-medium text-xs text-center px-3 py-2 rounded-full"
                            value={tradingTypeValue}

                        />
                    </div>
                </div>

                <div className="flex  gradient-background !p-0 !rounded-full">
                    {
                        ['long', 'short'].map((type) => (
                            <button className={`flex-1 capitalize text-neutral-500 py-2 text-xs  transition-all rounded-full ${longShort === type ? 'bg-green-500 text-neutral-950' : 'text-neutral-500'}`}
                                key={type} onClick={() => setLongShort(type as LongShort)}>
                                {type}

                            </button>
                        ))
                    }


                </div>

                <div className="flex gradient-background !p-0 !rounded-full">
                    {
                        ['market', 'limit', 'stop'].map((type) => (
                            <button className={`flex-1  capitalize text-neutral-500 py-2 text-xs rounded-full  transition-all ${orderType === type ? 'bg-green-500 text-neutral-950' : 'text-neutral-500'}`}
                                key={type} onClick={() => setOrderType(type as OrderType)}>
                                {type}

                            </button>
                        ))
                    }
                </div>
            </div>


            <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">

                    <div className="flex-1 max-w-[50%] space-y-2">
                        <label className="text-sm text-neutral-500">Trigger Price</label>
                        <div className="gradient-background !p-0 ">
                        <input
                            type="text"
                            onChange={(e)=>setTriggerPrice(e.target.value)}
                            className="w-full text-neutral-500 font-medium text-xs text-center px-3 py-2 rounded-full"
                            value={triggerPrice}


                        />
                        </div>
                    </div>
                    <div className="flex-1 max-w-[50%]  space-y-2">
                        <label className="text-sm text-neutral-500">Order Price</label>
                        <div className="gradient-background !p-0 ">
                        <input

                            type="text"
                            onChange={(e)=>setOrderPrice(e.target.value)}
                            className="w-full text-neutral-500 font-medium text-xs text-center px-3 py-2 rounded-full"
                            value={orderPrice}
                        />
                        </div>

                    </div>

                </div>
                <div className="flex-1   space-y-2">
                        <label className="text-sm text-neutral-500">Leverage</label>
                        <div className="gradient-background !p-0 ">
                        <input



                            type="text"
                            onChange={(e)=>setLeverage(Number(e.target.value))}
                            className="w-full text-neutral-500 font-medium text-xs text-center px-3 py-2 rounded-full"
                            value={leverage}
                        />

                        </div>

                    </div>
                {['Trigger Price', 'Order Price', 'Amount', 'Leverage'].map((field) => (
                    <div key={field} className="space-y-2">
                        <label className="text-sm text-gray-400">{field}</label>
                        <input
                            type="text"
                            className="w-full bg-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>
                ))}
                <button className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600">
                    Place Order
                </button>
            </div>
        </div>
    )
}

export default OrderForm