import { useCallback, useEffect, useState } from "react";
import { CoinData, CoinReturn, getCoinById } from "../../services/CryptoService";
import CustomChartWidget from "../common/CustomChartWidget";
import { MarketData } from "./PairBanner";

type Filters = '1H' | '1D' | '1W' | '1M' | '1Y'
function ChartArea({symbol}: {symbol: MarketData}) {
    const [activeTab, setActiveTab] = useState('depth');
    const [timeFilter, setTimeFilter] = useState<Filters>('1H');
    const [graphData, setGraphData] = useState<CoinReturn>()
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [filteredData, setFilteredData] = useState<CoinData[]>([])

    const getCoin =useCallback(async () => {
        const list = await getCoinById(symbol.BASE || "BTC", symbol.QUOTE || "USDT")
        setGraphData(list)
        setFilteredData(list.hChanges)
        setIsLoading(false)
    }, [symbol])

    useEffect(() => {
          getCoin()
    }, [getCoin])

    const changeGraph = (filter: Filters) => {
        setIsLoading(true);
        setTimeFilter(filter);

        setTimeout(() => {
            const newData = (() => {
                switch (filter) {
                    case "1H": return graphData?.hChanges;
                    case "1D": return graphData?.dChanges;
                    case "1W": return graphData?.wChanges;
                    case "1M": return graphData?.mChanges;
                    case "1Y": return graphData?.yChanges;
                    default: return [];
                }
            })();

            setFilteredData(newData || []);
            setIsLoading(false);
        }, 0);
    }
    return (
        <div className="gradient-background">
            <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-4">

                    {['Depth', 'Pending', 'Deals', 'Last Price'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`px-4 py-1 text-sm rounded-full text-neutral-400 ${activeTab === tab.toLowerCase()
                                ? 'bg-green-500 text-neutral-950'
                                : 'hover:bg-neutral-800'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="flex space-x-2 gradient-background !rounded-full !p-0 ">
                    {(['1H', '1D', '1W', '1M', '1Y'] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => changeGraph(filter)}
                            className={`px-3 text-xs py-1 rounded-full text-neutral-400 ${timeFilter === filter
                                ? 'bg-green-500 text-neutral-950'
                                : 'hover:bg-neutral-800'
                                }`}


                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>
            <div className="  rounded p-4">
                {filteredData && (
                    <CustomChartWidget
                        setIsLoading={setIsLoading}
                        isLoading={isLoading}
                        data={filteredData}
                        timeFilter={timeFilter}
                    />
                )}
            </div>
        </div>
    )
}

export default ChartArea