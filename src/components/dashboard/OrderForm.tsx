import { useState, useEffect } from "react";
import { formatLength } from "../../util/formatCurrency";
import { MarketData } from "./PairBanner";
import { errorToast, successToast } from "../../components/common/sweetAlerts";
import Switch from "../common/SwitchOption";

type TradingType = 'isolated' | 'multiplied';
type LongShort = 'long' | 'short';
type OrderType = 'market' | 'limit' | 'stop';

// Add these helper functions before the OrderForm component
const calculateCommission = (amount: string, price: string, tradingVolume: number): number => {
    // Tiered commission rates based on 30-day trading volume
    let commissionRate = 0.001; // Default 0.1%
    if (tradingVolume > 1000000) commissionRate = 0.0008; // 0.08%
    if (tradingVolume > 5000000) commissionRate = 0.0006; // 0.06%
    if (tradingVolume > 10000000) commissionRate = 0.0004; // 0.04%

    return Number(amount) * Number(price) * commissionRate;
};

const calculateLiquidationPrice = (
    entryPrice: string,
    leverage: string,
    longShort: LongShort,
    maintenanceMargin: number = 0.005
): number => {
    const leverageNum = Number(leverage) || 1;
    const priceNum = Number(entryPrice);

    // Maintenance margin increases with leverage
    const adjustedMaintenance = maintenanceMargin * (1 + (leverageNum / 100));

    if (longShort === 'long') {
        return priceNum * (1 - (1 / leverageNum) + adjustedMaintenance);
    }
    return priceNum * (1 + (1 / leverageNum) - adjustedMaintenance);
};

const calculateMargin = (amount: string, leverage: string): number => {
    return Number(amount) / (Number(leverage) || 1);
};

const calculateMaxPosition = (marginBalance: number, leverage: string): number => {
    return marginBalance * (Number(leverage) || 1);
};

// Add these interfaces at the top of the file
interface Detail {
    name: string;
    value: string;
    unit?: string;
}

interface MarginUsage {
    name: string;
    value: string;
    unit?: string;
}

interface OrderPayload {
    symbol?: string;
    type: OrderType;
    side: LongShort;
    amount: number;
    leverage: number;
    marginType: TradingType;
    postOnly: boolean;
    price?: number;
    stopPrice?: number;
    takeProfit?: number;
    stopLoss?: number;
    timestamp: number;
}

// Update the OrderForm component props type
interface OrderFormProps {
    symbol: MarketData | null;
}

function OrderForm({ symbol }: OrderFormProps) {
    const [tradingType, setTradingType] = useState<TradingType>('isolated');
    const [tradingTypeValue, setTradingTypeValue] = useState<number>(0);
    const [orderType, setOrderType] = useState<OrderType>('market');
    const [longShort, setLongShort] = useState<LongShort>('long');

    const [leverage, setLeverage] = useState('');
    const [orderPrice, setOrderPrice] = useState('');
    const [triggerPrice, setTriggerPrice] = useState('');
    const [amount, setAmount] = useState('100');
    const [postOnly, setPostOnly] = useState(false);

    const [details, setDetails] = useState<Detail[]>([
        { name: 'Commission', value: '0.1%', unit: symbol?.QUOTE },
        { name: 'Av Liquidation Price', value: '10000', unit: symbol?.QUOTE },
        { name: 'Margin', value: '100 ', unit: symbol?.QUOTE },
        { name: 'Max Position Amount', value: '1000 ', unit: symbol?.QUOTE }
    ]);

    const [marginUsage, setMarginUsage] = useState<MarginUsage[]>([
        { name: 'Margin Balance', value: '101200', unit: symbol?.QUOTE },
        { name: 'USDT Wallet balance', value: '100000', unit: symbol?.QUOTE },
        { name: 'USDT Wallet usage', value: '10%', unit: symbol?.QUOTE },
        { name: 'Max Cross Margin', value: '+300', unit: symbol?.QUOTE },
        { name: 'Unrealized PnL', value: '+12%', unit: symbol?.QUOTE },
        { name: 'Free Margin', value: '90000', unit: symbol?.QUOTE }
    ]);

    // Add new state for TP/SL
    const [takeProfitPrice, setTakeProfitPrice] = useState('');
    const [stopLossPrice, setStopLossPrice] = useState('');
    const [maxLeverage] = useState(100); // Maximum leverage allowed

    // Add new state for TP/SL toggle
    const [tpslEnabled, setTpslEnabled] = useState(false);

    // Validate leverage input
    const handleLeverageChange = (value: string): void => {
        const leverageNum = Number(value);
        if (leverageNum > maxLeverage) {
            errorToast(`Maximum leverage allowed is ${maxLeverage}x`);
            setLeverage(maxLeverage.toString());
            return;
        }
        if (leverageNum < 1) {
            setLeverage('1');
            return;
        }
        setLeverage(value);
    };

    // Update details calculation when relevant values change
    useEffect(() => {
        const price = orderType === 'market' ? symbol?.PRICE || 0 : Number(orderPrice);
        // const leverageNum = Number(leverage) || 1;
        // const amountNum = Number(amount);

        const commission = calculateCommission(amount, price.toString(), 0);
        const liquidationPrice = calculateLiquidationPrice(price.toString(), leverage, longShort);
        const marginRequired = calculateMargin(amount, leverage);
        const maxPosition = calculateMaxPosition(Number(marginUsage[0].value), leverage);

        setDetails([
            { name: 'Commission', value: commission.toFixed(2), unit: symbol?.QUOTE },
            { name: 'Av Liquidation Price', value: liquidationPrice.toFixed(2), unit: symbol?.QUOTE },
            { name: 'Margin', value: marginRequired.toFixed(2), unit: symbol?.QUOTE },
            { name: 'Max Position Amount', value: maxPosition.toFixed(2), unit: symbol?.QUOTE }
        ]);
    }, [amount, leverage, orderPrice, orderType, longShort, symbol]);

    // Update margin usage calculations
    useEffect(() => {
        const walletBalance = 100000; // This should come from your wallet state
        const marginBalance = walletBalance + (walletBalance * 0.012); // Including unrealized PnL
        const walletUsage = (Number(amount) / walletBalance) * 100;
        const freeMargin = marginBalance - calculateMargin(amount, leverage);

        setMarginUsage([
            { name: 'Margin Balance', value: marginBalance.toFixed(2), unit: symbol?.QUOTE },
            { name: 'USDT Wallet balance', value: walletBalance.toFixed(2), unit: symbol?.QUOTE },
            { name: 'USDT Wallet usage', value: `${walletUsage.toFixed(1)}%`, unit: symbol?.QUOTE },
            { name: 'Max Cross Margin', value: '+300', unit: symbol?.QUOTE },
            { name: 'Unrealized PnL', value: '+12%', unit: symbol?.QUOTE },
            { name: 'Free Margin', value: freeMargin.toFixed(2), unit: symbol?.QUOTE },
        ]);
    }, [amount, leverage, symbol]);

    // Update place order handler
    const handlePlaceOrder = (): void => {
        const orderPayload: OrderPayload = {
            symbol: symbol?.BASE,
            type: orderType,
            side: longShort,
            amount: Number(amount),
            leverage: Number(leverage),
            marginType: tradingType,
            postOnly,
            price: orderType !== 'market' ? Number(orderPrice) : undefined,
            stopPrice: orderType === 'stop' ? Number(triggerPrice) : undefined,
            takeProfit: takeProfitPrice ? Number(takeProfitPrice) : undefined,
            stopLoss: stopLossPrice ? Number(stopLossPrice) : undefined,
            timestamp: Date.now(),
        };

        // Validate order
        if (!symbol?.BASE) {
            errorToast('Please select a trading pair');
            return;
        }

        if (!amount || Number(amount) <= 0) {
            errorToast('Please enter a valid amount');
            return;
        }

        if (!leverage || Number(leverage) < 1) {
            errorToast('Please enter valid leverage');
            return;
        }

        if (orderType !== 'market' && (!orderPrice || Number(orderPrice) <= 0)) {
            errorToast('Please enter a valid order price');
            return;
        }

        if (orderType === 'stop' && (!triggerPrice || Number(triggerPrice) <= 0)) {
            errorToast('Please enter a valid trigger price');
            return;
        }

        if (!validateTPSL()) {
            return;
        }

        console.log('Placing order:', orderPayload);
        // TODO: Send order to your API
        successToast('Order placed successfully');
    };

    // Update the validateTPSL function to check if TP/SL is enabled
    const validateTPSL = (): boolean => {
        if (!tpslEnabled) return true;

        const currentPrice = Number(orderPrice) || symbol?.PRICE || 0;

        if (takeProfitPrice && longShort === 'long' && Number(takeProfitPrice) <= currentPrice) {
            errorToast('Take Profit must be higher than entry price for long positions');
            return false;
        }

        if (takeProfitPrice && longShort === 'short' && Number(takeProfitPrice) >= currentPrice) {
            errorToast('Take Profit must be lower than entry price for short positions');
            return false;
        }

        if (stopLossPrice && longShort === 'long' && Number(stopLossPrice) >= currentPrice) {
            errorToast('Stop Loss must be lower than entry price for long positions');
            return false;
        }

        if (stopLossPrice && longShort === 'short' && Number(stopLossPrice) <= currentPrice) {
            errorToast('Stop Loss must be higher than entry price for short positions');
            return false;
        }

        return true;
    };

    return (
        <div className="gradient-background p-4 space-y-4   w-full">

            <div className="border-b border-neutral-500/30 space-y-4 pb-4">


                <div className="flex items-center justify-between gradient-background !rounded-full !p-0">
                    <div className="flex-1 max-w-[50%]">
                        <select
                            className="w-full outline-0 border-0 px-3 py-2 text-neutral-500 capitalize text-xs text-center"
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTradingType(e.target.value as TradingType)}
                        >
                            {['isolated', 'multiplied'].map((type) => (
                                <option value={type} key={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 max-w-[50%]">
                        <input
                            type="number"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTradingTypeValue(Number(e.target.value))}
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


            <div className="space-y-4 border-b border-neutral-500/30 pb-4">
                <div className="flex items-center justify-between space-x-2">


                    <div className="flex-1 max-w-[50%] space-y-2">
                        <label className="text-sm text-neutral-500">Trigger Price</label>
                        <div className="gradient-background !p-0 ">
                            <input
                                type="number"
                                placeholder="0"
                                onChange={(e) => setTriggerPrice(e.target.value)}
                                className="w-full text-neutral-500 font-medium text-xs text-center px-3 py-2 rounded-full"
                                value={triggerPrice}
                                min="0"
                                step="any"


                            />
                        </div>
                    </div>
                    <div className="flex-1 max-w-[50%]  space-y-2">
                        <label className="text-sm text-neutral-500">Order Price</label>
                        <div className="gradient-background !p-0 ">
                            <input
                                type="number"
                                placeholder="0"
                                onChange={(e) => setOrderPrice(e.target.value)}
                                className="w-full text-neutral-500 font-medium text-xs text-center px-3 py-2 rounded-full"
                                value={orderPrice}
                                min="0"
                                step="any"


                            />
                        </div>

                    </div>

                </div>
                <div className="flex-1   space-y-2">
                    <label className="text-sm text-neutral-500">Leverage</label>
                    <div className="gradient-background !p-0 flex items-center justify-between ">
                        <input
                            type="number"
                            placeholder="2"
                            onChange={(e) => handleLeverageChange(e.target.value)}
                            className="w-full text-white font-medium text-xs text-left px-3 py-2 rounded-full"
                            value={leverage}
                            min="1"
                            step="1"


                        />
                        <select className="w-full text-neutral-500 font-medium text-xs text-right px-3 py-2 rounded-full">
                            <option value="2x">2x</option>
                            <option value="3x">3x</option>
                            <option value="4x">4x</option>
                            <option value="5x">5x</option>
                            <option value="6x">6x</option>


                        </select>
                    </div>

                </div>
                <div className="flex-1   space-y-2">
                    <div className="flex flex-col">
                        <label className="text-sm text-neutral-500">Position Amount</label>
                        <span className="text-xs text-neutral-500">Available Margin: <span className="text-white">{formatLength(90000)} {symbol?.QUOTE}</span></span>
                    </div>


                    <div className="gradient-background !p-0 flex items-center justify-between ">
                        <input
                            type="number"
                            placeholder="100"
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full text-white font-medium text-xs text-left px-3 py-2 rounded-full"
                            value={amount}
                            min="0"
                            step="any"

                        />
                        <select className="w-full text-neutral-500 font-medium text-xs text-right px-3 py-2 rounded-full">
                            <option value="USDT">USDT</option>
                            <option value="BTC">BTC</option>
                            <option value="ETH">ETH</option>
                            <option value="XRP">XRP</option>
                            <option value="LTC">LTC</option>

                        </select>

                    </div>

                </div>
                <div className={`flex items-center justify-between space-x-2 transition-all duration-300 ${tpslEnabled ? 'flex' : 'hidden'}`}>
                    <div className="flex-1 max-w-[50%] space-y-2">
                        <label className="text-sm text-neutral-500">Take Profit</label>
                        <div className="gradient-background !p-0">



                            <input
                                type="number"
                                placeholder="0"
                                onChange={(e) => setTakeProfitPrice(e.target.value)}
                                className="w-full text-neutral-500 font-medium text-xs text-center px-3 py-2 rounded-full"
                                value={takeProfitPrice}
                                min="0"
                                step="any"
                                disabled={!tpslEnabled}
                            />
                        </div>
                    </div>
                    <div className="flex-1 max-w-[50%] space-y-2">
                        <label className="text-sm text-neutral-500">Stop Loss</label>
                        <div className="gradient-background !p-0">
                            <input
                                type="number"
                                placeholder="0"
                                onChange={(e) => setStopLossPrice(e.target.value)}
                                className="w-full text-neutral-500 font-medium text-xs text-center px-3 py-2 rounded-full"
                                value={stopLossPrice}
                                min="0"
                                step="any"
                                disabled={!tpslEnabled}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="text-xs text-neutral-500">TIF</div>
                        <select className="w-full text-white font-medium text-xs text-left py-2 rounded-full !p-0">
                            <option value="GTC">GTC</option>
                            <option value="IOC">IOC</option>
                            <option value="FOK">FOK</option>
                            <option value="GTT">GTT</option>

                        </select>
                    </div>
                    <div className="flex items-center space-x-2">

                        <Switch
                            isOn={postOnly}
                            onToggle={() => setPostOnly(!postOnly)}
                        />

                        <div className="text-xs text-neutral-500">POST ONLY</div>
                    </div>
                </div>


            </div>

            <div className="space-y-4 border-b border-neutral-500/30 pb-4">
                <div className="flex flex-col space-y-1">
                    {details.map((type, index) => (
                        <div className="flex items-center justify-between" key={index}>
                            <div className="text-xs text-neutral-500">
                                {type.name}
                            </div>
                            <div className="text-xs text-white">
                                {type.value} {' '}
                                <span className="text-xs text-neutral-500">
                                    {type.unit}
                                </span>
                            </div>

                        </div>



                    ))}
                </div>
                <button
                    className="w-full bg-green-500 text-neutral-950 py-3 rounded-lg font-bold hover:bg-green-600 text-sm"
                    onClick={handlePlaceOrder}
                >
                    Place Order
                </button>
            </div>
            <div className="space-y-4">
                <div>Margin Usage</div>
                <div className="flex flex-col space-y-1">
                    {marginUsage.map((type, index) => (
                        <div className="flex items-center justify-between" key={index}>
                            <div className="text-xs text-neutral-500">
                                {type.name}

                            </div>
                            <div className="text-xs text-white">
                                {type.value}
                            </div>
                        </div>
                    ))}
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-neutral-500">
                            TP/SL
                        </div>
                        <Switch
                            isOn={tpslEnabled}
                            onToggle={() => setTpslEnabled(!tpslEnabled)}
                        />

                    </div>


                </div>
            </div>



        </div>

    )

}


export default OrderForm