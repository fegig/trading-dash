import { useState } from "react"
import Dropdown from "../common/Dropdown"
import Switch from "../common/SwitchOption"
import { formatNumber } from "../../util/formatCurrency"

type HistoryType = {
    open:boolean,
    completed:boolean,
    pending:boolean,
    canceled:boolean
}
type MiniTradeHistorySelectorProps = {
    historyType: HistoryType,
    setHistoryType: React.Dispatch<React.SetStateAction<HistoryType>>
}

function MiniTradeHistorySelector({historyType, setHistoryType }:MiniTradeHistorySelectorProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)


    const handleTypeToggle = (key: keyof HistoryType) => {
        setHistoryType(prev => ({
            ...prev,
            [key]: !prev[key]
        }))
    }

    const getActiveTypesText = () => {
        const activeTypes = Object.entries(historyType)
            .filter(([, value]) => value)
            .map(([key]) => key)
            .join(", ")
        return activeTypes || "Select Types"
    }

    return (
<div className="flex justify-between items-center">
    <div className="gradient-background !p-2 rounded-lg relative z-50">
        <div className="flex items-center gap-4 justify-between ">
            <Dropdown
                isOpen={isDropdownOpen}
                onClose={() => setIsDropdownOpen(false)}
                trigger={
                    <button
                        onClick={() => setIsDropdownOpen(true)}
                        className="flex items-center justify-between hover:opacity-80 w-32"
                    >   
                        <span className="text-xs font-medium capitalize truncate">{getActiveTypesText()}</span>
                        <i className={`fi fi-rr-angle-down text-xs ${isDropdownOpen ? 'rotate-180' : ''} transition-all duration-300 ml-2 flex-shrink-0`} />
                    </button>
                }
                items={[
                    { key: 'open', label: 'Open' },
                    { key: 'pending', label: 'Pending' },
                    { key: 'canceled', label: 'Canceled' },
                    { key: 'completed', label: 'Completed' }
                ]}
                renderItem={(item) => (
                    <div 
                        className="flex items-center gap-2 px-4 py-2 hover:bg-neutral-800 rounded cursor-pointer"
                    >
                        <Switch
                            isOn={historyType[item.key as keyof HistoryType]}
                            onToggle={() => handleTypeToggle(item.key as keyof HistoryType)}
                        />
                        <span className="capitalize text-xs">{item.label}</span>
                    </div>
                )}
            />
        </div>
    </div>
        <div>
            <button className=" gradient-background !rounded-lg !p-2 text-xs text-neutral-500 hover:text-neutral-400 flex items-center gap-2">
                <i className="fi fi-rr-exchange text-sm"></i>
                <span className="text-xs">All Orders</span>
            </button>
        </div>
       </div>
    
    )
}

type History = {
    base: string,                  // Base currency (e.g., BTC)
    quote: string,                 // Quote currency (e.g., USDT) 
    entryPrice: number,            // Entry price of the trade
    exitPrice?: number,            // Exit price of the trade
    type: 'long' | 'short',        // Trade direction
    leverage: number,              // Leverage used
    margin: number,                // Initial margin
    marginPercentage: number,      // Margin percentage
    marginType: 'isolated' | 'cross',
    size: number,                  // Position size
    pnl: number,                   // Profit/Loss
    sl: number,                    // Stop Loss price
    tp: number,                    // Take Profit price
    status: 'open' | 'completed' | 'pending' | 'canceled',           // Trade status (open/pending/canceled)
    time: number,                  // Timestamp of trade
    fees: number,                  // Trading fees
    liquidationPrice: number,      // Liquidation price
    marketPrice: number,           // Current market price
    unrealizedPnl?: number,        // Unrealized PnL for open positions
    realizedPnl?: number,          // Realized PnL for closed positions
    id: string,                    // Unique trade identifier
}

const TradeHistory: History[] = [
    {
        id: "trade_1",
        base: "BTC",
        quote: "USDT",
        entryPrice: 45000,
        type: "long",
        leverage: 10,
        margin: 1000,
        marginPercentage: 10,
        marginType: 'isolated',
        size: 10000,
        pnl: 500,
        sl: 44000,
        tp: 48000,
        status: 'open',
        time: Date.now() - 3600000, // 1 hour ago
        fees: 15,
        liquidationPrice: 41000,
        marketPrice: 45500,
        unrealizedPnl: 500
    },
    {
        id: "trade_2",
        base: "ETH",
        quote: "USDT",
        entryPrice: 2800,
        exitPrice: 2900,
        type: "long",
        leverage: 5,
        margin: 2000,
        marginPercentage: 10,
        marginType: 'isolated',
        size: 10000,
        pnl: 357.14,
        sl: 2700,
        tp: 3000,
        status: 'completed',
        time: Date.now() - 7200000, // 2 hours ago
        fees: 12,
        liquidationPrice: 2600,
        marketPrice: 2900,
        realizedPnl: 357.14
    },
    {
        id: "trade_3",
        base: "SOL",
        quote: "USDT",
        entryPrice: 95,
        type: "short",
        leverage: 20,
        margin: 500,
        marginPercentage: 10,
        marginType: 'cross',
        size: 10000,
        pnl: 0,
        sl: 98,
        tp: 90,
        status: 'pending',
        time: Date.now() - 1800000, // 30 minutes ago
        fees: 8,
        liquidationPrice: 99,
        marketPrice: 95
    },
    {
        id: "trade_4",
        base: "BNB",
        quote: "USDT",
        entryPrice: 320,
        exitPrice: 315,
        type: "short",
        leverage: 15,
        margin: 800,
        marginPercentage: 10,
        marginType: 'cross',
        size: 12000,
        pnl: 234.75,
        sl: 325,
        tp: 310,
        status: 'completed',
        time: Date.now() - 900000, // 15 minutes ago
        fees: 10,
        liquidationPrice: 328,
        marketPrice: 315,
        realizedPnl: 234.75
    },
    {
        id: "trade_5",
        base: "XRP",
        quote: "USDT",
        entryPrice: 0.55,
        exitPrice: 0.52,
        type: "short",
        leverage: 25,
        margin: 300,
        marginPercentage: 10,
        marginType: 'cross',
        size: 7500,
        pnl: 409.09,
        sl: 0.57,
        tp: 0.52,
        status: 'completed',
        time: Date.now() - 14400000, // 4 hours ago
        fees: 5,
        liquidationPrice: 0.58,
        marketPrice: 0.52,
        realizedPnl: 409.09
    }
];

const MiniTradeHistory = () => {
    const [historyType, setHistoryType] = useState<HistoryType>({
        open: true,
        pending: true,
        canceled: true,
        completed: true
    })
    
    const filteredHistory = TradeHistory.filter(trade => {
        if (trade.status === 'completed' && historyType.completed) return true;
        if (trade.status === 'open' && historyType.open) return true;
        if (trade.status === 'pending' && historyType.pending) return true;
        if (trade.status === 'canceled' && historyType.canceled) return true;
        return false;
    });
    
    return (
        <>
            <MiniTradeHistorySelector historyType={historyType} setHistoryType={setHistoryType}/>

            <div className="max-h-[250px] overflow-y-auto scrollBar">
                <div className="flex flex-col space-y-4 pb-4 z-0">
                    {filteredHistory.map((trade) => (
          
                    <div key={trade.id} className="flex items-center justify-between gradient-background p-4 rounded-lg">
                        <div className="flex flex-col gap-2 basis-3/5">

                        <div className="flex items-center gap-2">
                            <div className="flex items-center -space-x-1">
                                <img src={`https://assets.coincap.io/assets/icons/${trade.base.toLowerCase()}@2x.png`} alt={trade.base} className="w-4 h-4 rounded-full" />
                                <img src={`https://assets.coincap.io/assets/icons/${trade.quote.toLowerCase()}@2x.png`} alt={trade.quote} className="w-4 h-4 rounded-full" />

                                </div>
                            <span className="text-xs uppercase">{trade.base}-{trade.quote}</span>
                            <span className={`text-[10px] capitalize bg-gradient-to-r  
                                                ${trade.status === 'open' ? ' from-blue-500/10  to-transparent text-blue-600' : 
                                                trade.status === 'pending' ? 'from-yellow-500/10 to-transparent text-yellow-600' : 
                                                trade.status === 'completed' ? 'from-green-500/10 to-transparent text-green-600' :
                                                'from-red-500/10 to-transparent text-red-600'} px-2 py-1 rounded-full`}>{trade.status}</span>
                        </div>
                        <div className="grid grid-cols-5 space-x-8 text-xs flex-wrap">

                            {['Type', 'Size','Entry Price', 'Margin', 'Margin Usage'].map((item) => (
                                <div key={item} className="flex flex-col space-y-3 justify-between">
                                  

                                    {item === 'Type' ? trade.type && (
                                        <>
                                        <span className="text-neutral-400 text-[10px]">{item}</span>
                                        <span className={` capitalize text-xs ${trade.type === 'long' ? 'text-green-500' : 'text-red-500'} `}>{trade.type}</span>
                                        </>
                                    ) : item === 'Size' ? trade.size && (
                                        <>
                                        <span className="text-neutral-400 text-[10px]">{item} ({trade.base})</span>
                                        <span className="text-neutral-300 capitalize text-xs">{trade.size}</span>
                                        </>
                                    ) : item === 'Entry Price' ? trade.entryPrice && (
                                        <>
                                        <span className="text-neutral-400 text-[10px]">{item}</span>
                                        <span className="text-neutral-300 capitalize text-xs">{formatNumber(trade.entryPrice)}</span>
                                        </>
                                    ): item === 'Margin' ? trade.margin && (
                                        <>
                                        <span className="text-neutral-400 text-[10px]">{item} <span className="italic ">({trade.marginType})</span></span>
                                        <span className="text-neutral-300 capitalize text-xs">{formatNumber(trade.margin)}</span>
                                        </>
                                    ) : item === 'Margin Usage' ? trade.marginPercentage && (
                                        <>
                                        <span className="text-neutral-400 text-[10px]">Margin <span className="italic ">(Usage)</span></span>
                                        <span className="text-neutral-300 capitalize text-xs">{trade.marginPercentage}%</span>
                                        </>
                                    )  : null}
                                </div>
                            ))}

                        </div>

                                        </div>

                        <div className="flex flex-col w-full basis-2/5">
                            <div className="mt-4 relative h-6 mx-4">
                                <div className="absolute w-full h-[2px] bg-neutral-800 top-1/2 -translate-y-1/2">
                                    {/* Price Markers Container */}
                                    <div className="relative w-full h-full">
                                        {/* Stop Loss Marker */}
                                        <div className="absolute left-0 flex flex-col items-center">
                                            <div className="absolute top-2 whitespace-nowrap text-center">
                                                <span className="block text-[10px] text-neutral-400">SL</span>
                                                <span className="block text-[10px] text-red-500">${formatNumber(trade.sl)}</span>
                                            </div>
                                            <div className="absolute h-3 w-[2px] bg-red-500 top-1/2 -translate-y-1/2" />
                                        </div>

                                        {/* Entry Price Marker */}
                                        <div 
                                            className="absolute flex flex-col items-center"
                                            style={{ left: `${((trade.entryPrice - trade.sl) / (trade.tp - trade.sl)) * 100}%` }}
                                        >
                                            <div className="absolute top-2 whitespace-nowrap text-center">
                                                <span className="block text-[10px] text-neutral-400">Entry</span>
                                                <span className="block text-[10px]">${formatNumber(trade.entryPrice)}</span>
                                            </div>
                                            <div className="absolute h-4 w-[2px] bg-white top-1/2 -translate-y-1/2" />
                                        </div>

                                        {/* Current Price Marker */}
                                        <div 
                                            className="absolute flex flex-col items-center"
                                            style={{ left: `${((trade.marketPrice - trade.sl) / (trade.tp - trade.sl)) * 100}%` }}
                                        >
                                            <div className="absolute -top-10 whitespace-nowrap text-center">
                                                <span className="block text-[10px] text-neutral-400">Current</span>
                                                <span className={`block text-[10px] ${trade.type === 'long' ? 'text-green-500' : 'text-red-500'}`}>
                                                    ${formatNumber(trade.marketPrice)}
                                                </span>
                                            </div>
                                            <div className={`absolute h-4 w-[2px] ${trade.type === 'long' ? 'bg-green-500' : 'bg-red-500'} top-1/2 -translate-y-1/2`} />
                                        </div>

                                        {/* Take Profit Marker */}
                                        <div className="absolute right-0 flex flex-col items-center">
                                            <div className="absolute top-2 whitespace-nowrap text-center">
                                                <span className="block text-[10px] text-neutral-400">TP</span>
                                                <span className="block text-[10px] text-green-500">${formatNumber(trade.tp)}</span>
                                            </div>
                                            <div className="absolute h-3 w-[2px] bg-green-500 top-1/2 -translate-y-1/2" />
                                        </div>

                                        {/* Progress Fill */}
                                        <div 
                                            className={`absolute h-full ${trade.type === 'long' ? 'bg-green-500/50' : 'bg-red-500/50'}`}
                                            style={{ 
                                                left: `${((trade.entryPrice - trade.sl) / (trade.tp - trade.sl)) * 100}%`,
                                                width: `${((trade.marketPrice - trade.entryPrice) / (trade.tp - trade.sl)) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            </div>
        </>
    )
}

export default MiniTradeHistory