import { useState } from 'react';
import { formatCurrency, formatNumber } from '../../util/formatCurrency';
import DepthSelector from './DepthSelector';
import { MarketData } from './PairBanner';

interface OrderBookEntry {
    price: number;
    quantity: number;
}



function OrderBook({symbol}: {symbol: MarketData}) {
    const asks: OrderBookEntry[] = [
        { price: 43300.75, quantity: 0.3150 },
        { price: 43275.50, quantity: 1.1200 },
        { price: 43250.25, quantity: 0.4235 },
        { price: 43225.50, quantity: 1.2100 },
        { price: 43200.75, quantity: 0.8750 },
        { price: 43175.00, quantity: 2.1000 },
        { price: 43150.25, quantity: 1.5500 },
        { price: 43125.75, quantity: 0.9300 },
        { price: 43100.50, quantity: 1.6400 },
        { price: 43075.25, quantity: 0.7800 },
    ] ;
    const bids: OrderBookEntry[] = [

        { price: 43050.00, quantity: 1.8900 },
        { price: 43025.75, quantity: 0.9250 },
        { price: 43000.50, quantity: 1.3400 },
        { price: 42975.25, quantity: 2.4500 },
        { price: 42950.00, quantity: 0.6800 },
        { price: 42925.75, quantity: 1.2300 },
        { price: 42900.50, quantity: 0.8900 },
        { price: 42875.25, quantity: 1.7600 },
        { price: 42850.00, quantity: 0.5400 },
        { price: 42825.75, quantity: 1.4200 },
    ];

    const marketData: MarketData = {
        PRICE: 43150.75,
        CHANGEPCT24HOUR: 2.45
    };

    const [depth, setDepth] = useState(10);

    // Comment out WebSocket implementation for now
    /*useEffect(() => {
        const ws = new WebSocket('wss://streamer.cryptocompare.com/v2?api_key=YOUR_API_KEY');
        
        ws.onopen = () => {
            ws.send(JSON.stringify({
                "action": "SubAdd",
                "subs": [`ORDER-BOOK-${symbol}-USD`, `PRICE-${symbol}-USD`]
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.TYPE === "ORDER-BOOK") {
                if (data.SIDE === "ASK") {
                    setAsks(prev => [...prev.slice(0, 5)]);
                } else {
                    setBids(prev => [...prev.slice(0, 5)]);
                }
            } else if (data.TYPE === "PRICE") {
                setMarketData({
                    price: data.PRICE,
                    change24h: data.CHANGE24HOUR
                });
            }
        };

        return () => ws.close();
    }, [symbol]);*/

    // Function to get sliced orders based on depth
    const getOrders = (orders: OrderBookEntry[], depth: number) => {
        return orders.slice(0, depth);
    };

    return (
        <div className="gradient-background  w-full">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold">Order Book</h3>
                <div className="flex items-center space-x-4">
                    <DepthSelector 
                        currentDepth={depth} 
                        onDepthChange={setDepth} 
                    />
                   
                </div>
            </div>

        
            <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-400 mb-2">
                <div>Price ({symbol.QUOTE})</div>
                <div className="text-right">Size ({symbol.QUOTE})</div>
                <div className="text-right">Sum ({symbol.QUOTE})</div>
            </div>

            <div className="space-y-1">
            {getOrders(bids, depth).map((bid, i) => {
                    const sum = bids
                        .slice(0, i + 1)
                        .reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
                    
                    // Calculate width percentage from 100% to 50% based on index
                    const widthPercentage = 100 - ((i / (bids.length - 1)) * 50);
                    
                    return (
                        <div key={`bid-${i}`} className="grid grid-cols-3 gap-4 text-[10px] relative">
                            <div 
                                className="absolute inset-y-0 left-0 bg-green-400/10" 
                                style={{ width: `${widthPercentage}%` }}
                            />
                            <span className="text-green-400 relative">
                                {formatNumber(bid.price, 2)}
                            </span>
                            <span className="text-gray-400 text-right relative">
                                {formatNumber(bid.quantity, 4)}
                            </span>
                            <span className="text-gray-400 text-right relative">
                                {formatNumber(sum, 2)}
                            </span>
                        </div>
                    );
                })}
               
             
                <div className="flex justify-between items-center">
                    <span className="text-green-500 font-medium flex items-center space-x-1">
                        <i className="fi fi-rr-caret-up"></i>
                        {formatCurrency(marketData.PRICE || 0, 'USD')}
                    </span>

                    <span className={`text-xs ${marketData.CHANGEPCT24HOUR && marketData.CHANGEPCT24HOUR >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {marketData.CHANGEPCT24HOUR && marketData.CHANGEPCT24HOUR >= 0 ? '+' : ''}{marketData.CHANGEPCT24HOUR?.toFixed(2)}%
                    </span>
                </div>

                {getOrders(asks, depth).map((ask, i) => {
                    const sum = asks
                        .slice(i)
                        .reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
                    
                    // Calculate width percentage from 50% to 100% based on index
                    const widthPercentage = 50 + ((i / (asks.length - 1)) * 50);
                    
                    return (
                        <div key={`ask-${i}`} className="grid grid-cols-3 gap-4 text-[10px] relative">
                            <div 
                                className="absolute inset-y-0 left-0 bg-red-400/10" 
                                style={{ width: `${widthPercentage}%` }}
                            />
                            <span className="text-red-400 relative">
                                {formatNumber(ask.price, 2)}
                            </span>
                            <span className="text-gray-400 text-right relative">
                                {formatNumber(ask.quantity, 4)}
                            </span>
                            <span className="text-gray-400 text-right relative">
                                {formatNumber(sum, 2)}
                            </span>
                        </div>
                    );
                })}

            </div>
        </div>
    );
}

export default OrderBook;