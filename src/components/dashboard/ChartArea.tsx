import { useCallback, useEffect, useState } from "react";
import { CoinData, CoinReturn, getCoinById } from "../../services/CryptoService";
import CustomChartWidget from "../common/CustomChartWidget";
import { MarketData } from "./PairBanner";
import Modal from "../common/Modal";
import { ChartType, Filters } from "../../types/chat";



function ChartArea({ symbol }: { symbol: MarketData }) {
    const [activeTab, setActiveTab] = useState('depth');
    const [timeFilter, setTimeFilter] = useState<Filters>('1H');
    const [graphData, setGraphData] = useState<CoinReturn>()
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [filteredData, setFilteredData] = useState<CoinData[]>([])
    const [isTabModalOpen, setIsTabModalOpen] = useState(false);
    const [chartType, setChartType] = useState<ChartType>('line');

    const getCoin = useCallback(async () => {
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

    const handleTabChange = (tab: string) => {
        setActiveTab(tab.toLowerCase());
        setIsTabModalOpen(false);
    }

    const tabs = ['Depth', 'Pending', 'Deals', 'Last Price'];
    const filters = ['1H', '1D', '1W', '1M', '1Y'] as const;


    const handleChartTypeChange = () => {
        setIsLoading(true);
        setTimeout(() => {
            setChartType(prev => prev === 'candlestick' ? 'line' : 'candlestick');
            setTimeout(() => {
                setIsLoading(false);
            }, 300);
        }, 200);
    };


    return (
        <div className="gradient-background">
            <div className="flex justify-between items-center  p-2 md:p-0">
                {/* Desktop Tabs */}
                <div className="hidden md:flex space-x-4">
                    {tabs.map((tab) => (
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

                {/* Mobile Tabs Button */}
                <div className="md:hidden flex items-center">
                    <button
                        className="!px-3 text-xs lg:text-sm !rounded-full gradient-background !p-1.5  flex items-center space-x-2"
                        onClick={() => setIsTabModalOpen(true)}
                    >
                        <span className="capitalize text-xs text-neutral-400">{activeTab}</span>
                        <i className="fi fi-rr-angle-down text-xs text-neutral-400"></i>
                    </button>
                </div>
                

                <div className=" flex space-x-2 gradient-background !rounded-full !p-0 justify-between items-center "> 
                     <button
                        onClick={handleChartTypeChange}
                        className="px-3 text-xs py-1.5 rounded-full  bg-green-500 text-neutral-950"
                        aria-label={`Switch to ${chartType === 'candlestick' ? 'line' : 'candlestick'} chart`}
                    >
                        <i className={`fi fi-rr-${chartType === 'candlestick' ? 'chart-line-up' : 'chart-candlestick'}`}></i>
                    </button>
                    {filters.map((filter) => (
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

            <div className="rounded  ">
                {filteredData && (
                    <CustomChartWidget
                        chartType={chartType}
                        setChartType={setChartType}
                        setIsLoading={setIsLoading}
                        isLoading={isLoading}
                        data={filteredData}
                        timeFilter={timeFilter}
                    />
                )}
            </div>

            {/* Mobile Tab Selection Modal */}
            <Modal
                isOpen={isTabModalOpen}
                onClose={() => setIsTabModalOpen(false)}
                title="Select Chart Type"
            >
                <div className="grid grid-cols-1 gap-2  ">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab.toLowerCase())}
                            className={`gradient-background w-full text-left  text-xs px-4 !py-2 rounded-lg flex items-center justify-between ${activeTab === tab.toLowerCase()
                                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                    : 'hover:bg-neutral-800/50 text-neutral-400 '
                                }`}
                        >
                            <span>{tab}</span>
                            {activeTab === tab.toLowerCase() && (
                                <i className="fi fi-rr-check text-green-500"></i>
                            )}
                        </button>
                    ))}
                </div>
            </Modal>

        </div>
    );
}

export default ChartArea;