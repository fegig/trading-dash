import { useState } from "react";
import TradingViewWidget from "../common/TradingViewWidget";

function ChartArea() {
    const [activeTab, setActiveTab] = useState('depth');
    const [timeFilter, setTimeFilter] = useState('1D');

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
            {['1D', '1W', '1M', '3M', '1Y'].map((filter) => (
                <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
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
    <div className="h-[300px] bg-gray-900 rounded">
        <TradingViewWidget />
    </div>
</div>
  )
}

export default ChartArea