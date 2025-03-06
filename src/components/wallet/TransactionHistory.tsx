import { useEffect, useState } from "react";
import { TransactionHistoryProps, TransactionTimeFilter } from "../../types/wallet";
import { formatCurrency } from "../../util/formatCurrency";

const dommyTransactions: TransactionHistoryProps[] = [
    {
        id: "0x1234567890abcdef",
        type: 'deposit',
        amount: 0.231342,
        eqAmount:100,
        status: 'pending',
        createdAt: 1734953600,
        method: {
            type: 'crypto',
            name: 'Ethereum',
            symbol:'ETH',
            icon: 'https://assets.coincap.io/assets/icons/eth@2x.png',
        },
    },
    {
        id: 'Tsjnv0sjisdv897ywh7ehufhu9hvsdvu9uvd',
        type: 'deposit',
        amount: 100,
        eqAmount:100,
        status: 'completed',
        createdAt: 1726953600,
        method: {
            type: 'crypto',
            name: 'Tether',
            symbol:'USDT',
            icon: 'https://assets.coincap.io/assets/icons/usdt@2x.png',
        },
    },
    {
        id: 'dfkj9isfj9ifjgs9igdjf9grgje9rgdfg',
        type: 'withdrawal',
        amount: 1.4213,
        eqAmount:20.44,
        status: 'completed',
        createdAt: 1719432600,
        method: {
            type: 'crypto',
            name: 'XRP',
            symbol:'XRP',
            icon: 'https://assets.coincap.io/assets/icons/xrp@2x.png',
        },
    },
    {
        id: 'dfkj9isfj9ifjgs9igdjf9grgje9rgdfg',
        type: 'withdrawal',
        amount: 0.003824,
        eqAmount:2100,
        status: 'pending',
        createdAt: 1714953600,
        method: {
            type: 'crypto',
            name: 'Bitcoin',
            symbol:'BTC',
            icon: 'https://assets.coincap.io/assets/icons/btc@2x.png',
        },
    }
]

function TransactionHistory() {
    const [timeFilter, setTimeFilter] = useState<TransactionTimeFilter>('ALL');
    const [transactions, setTransactions] = useState<TransactionHistoryProps[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                setTimeout(() => {
                    setTransactions(dommyTransactions);
                    setIsLoading(false);
                }, 3000);

            } catch (error) {
                console.error('Error fetching transactions:', error);

            }
        };
        fetchTransactions();
    }, []);


    const filters = ['1D', '7D', '1M', '3M', '6M', '1Y', 'ALL'] as const;

    const handleFilterChange = (filter: TransactionTimeFilter) => {
        setTimeFilter(filter);

        setIsLoading(true);

        const currentTime = Math.floor(Date.now() / 1000);
        const filterTransactions = () => {
            let filterTimestamp = currentTime;

            switch (filter) {
                case '1D':
                    filterTimestamp = currentTime - (24 * 60 * 60); // 1 day in seconds
                    break;
                case '7D':
                    filterTimestamp = currentTime - (7 * 24 * 60 * 60); // 7 days in seconds
                    break;
                case '1M':
                    filterTimestamp = currentTime - (30 * 24 * 60 * 60); // 30 days in seconds
                    break;
                case '3M':
                    filterTimestamp = currentTime - (90 * 24 * 60 * 60); // 90 days in seconds
                    break;
                case '6M':
                    filterTimestamp = currentTime - (180 * 24 * 60 * 60); // 180 days in seconds
                    break;
                case '1Y':
                    filterTimestamp = currentTime - (365 * 24 * 60 * 60); // 365 days in seconds
                    break;
                case 'ALL':
                default:
                    setTimeout(() => {
                        setTransactions(dommyTransactions);
                        setIsLoading(false);
                    }, 500);
                    return;
            }

            const filteredTransactions = dommyTransactions.filter(
                transaction => transaction.createdAt >= filterTimestamp
            );

            setTimeout(() => {
                setTransactions(filteredTransactions);
                setIsLoading(false);
            }, 500);
        };

        filterTransactions();
    };


    return (

        <div className=' col-span-full md:col-span-2 lg:col-span-4 gradient-background rounded-lg p-4 space-y-4 my-4 max-h-[400px] overflow-y-auto scrollbar-none'>
            <div className='text-sm font-medium'>Transaction History</div>
            <div className='flex items-center gap-2 w-full justify-end'>
                <div className=" flex  gradient-background !rounded-full !p-0 justify-between items-center ">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => handleFilterChange(filter)}
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
            {isLoading ? <div className="flex justify-center items-center h-full w-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div> :
                transactions.length > 0 ?
                    <div className="flex gap-2 w-full  overflow-x-auto scrollbar-none ">
                        <table className="w-full min-w-[800px] border-separate border-spacing-y-3">
                            <thead className="">
                                <tr className="text-xs text-neutral-400">
                                    <th className="text-left pb-2 font-medium">Method</th>
                                    <th className="text-left pb-2 font-medium">ID</th>
                                    <th className="text-left pb-2 font-medium">Type</th>
                                    <th className="text-left pb-2 font-medium">Amount</th>
                                    <th className="text-left pb-2 font-medium">Status</th>
                                    <th className="text-left pb-2 font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs border-t border-neutral-800">
                                {transactions.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-neutral-800/30 transition-colors">
                                        <td className="py-3 pl-2 rounded-l-lg">
                                            <div className="flex items-center gap-2">
                                                <img src={transaction.method.icon} alt={transaction.method.name} className="w-5 h-5 rounded-full" />
                                                <span className="font-medium text-neutral-300">{transaction.method.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-neutral-500 truncate max-w-[100px]">{transaction.id.slice(0, 12)}...{transaction.id.slice(-4)}</td>
                                        <td className="py-3">
                                            <span className="px-2 py-1 rounded-full text-[10px] capitalize bg-neutral-800/50">
                                                {transaction.type}
                                            </span>
                                        </td>
                                        <td className="py-3 font-medium">
                                            <div className="flex items-center gap-2">

                                                <span className={`${transaction.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                                                    {transaction.type === 'deposit' ? '+' : '-'}
                                                    {transaction.amount}{transaction.method.type === 'crypto' ? ' ' + transaction.method.symbol : ''}
                                                </span>
                                                <span >
                                                  
                                                </span>
                                            </div>
                                            <span className="text-neutral-300 text-[10px]">
                                                {formatCurrency(transaction.eqAmount, 'USD', 2)}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded-full text-[10px] capitalize
                                    ${transaction.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                                    transaction.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                                        'bg-red-500/10 text-red-500'}`}>
                                                {transaction.status}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-2 rounded-r-lg">
                                            {new Date(transaction.createdAt * 1000).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div> :
                    <div className="flex justify-center items-center h-full w-full">
                        <div className="text-neutral-400">No transactions found</div>
                    </div>

            }

        </div>

    )
}

export default TransactionHistory