import { useMemo, useState } from 'react'
import type { TransactionHistoryProps, TransactionTimeFilter } from '@/types/wallet'
import { formatCurrency } from '@/util/formatCurrency'
import GradientBadge from '../common/GradientBadge'
import Pagination from '../common/Pagination'

const TX_PAGE_SIZE = 10

function MethodCell({ transaction }: { transaction: TransactionHistoryProps }) {
  return (
    <div className="flex items-center gap-2">
      {transaction.method.icon ? (
        <img src={transaction.method.icon} alt={transaction.method.name} className="w-5 h-5 rounded-full" />
      ) : (
        <div className="w-5 h-5 rounded-full bg-neutral-900 border border-neutral-700 grid place-items-center text-[10px] text-neutral-300">
          {transaction.method.iconClass ? <i className={transaction.method.iconClass} /> : transaction.method.symbol.slice(0, 1)}
        </div>
      )}
      <span className="font-medium text-neutral-300">{transaction.method.name}</span>
    </div>
  )
}

export default function TransactionHistory({
  transactions,
}: {
  transactions: TransactionHistoryProps[]
}) {
  const [timeFilter, setTimeFilter] = useState<TransactionTimeFilter>('ALL')
  const [txPage, setTxPage] = useState(1)
  const [renderTimestamp] = useState(() => Math.floor(Date.now() / 1000))
  const filters = ['1D', '7D', '1M', '3M', '6M', '1Y', 'ALL'] as const

  const filteredTransactions = useMemo(() => {
    if (timeFilter === 'ALL') return transactions
    const durationMap: Record<Exclude<TransactionTimeFilter, 'ALL'>, number> = {
      '1D': 24 * 60 * 60,
      '7D': 7 * 24 * 60 * 60,
      '1M': 30 * 24 * 60 * 60,
      '3M': 90 * 24 * 60 * 60,
      '6M': 180 * 24 * 60 * 60,
      '1Y': 365 * 24 * 60 * 60,
    }
    return transactions.filter(
      (transaction) => transaction.createdAt >= renderTimestamp - durationMap[timeFilter]
    )
  }, [renderTimestamp, timeFilter, transactions])

  const currentPage = Math.min(
    txPage,
    Math.max(1, Math.ceil(filteredTransactions.length / TX_PAGE_SIZE))
  )

  const pagedTransactions = useMemo(
    () =>
      filteredTransactions.slice((currentPage - 1) * TX_PAGE_SIZE, currentPage * TX_PAGE_SIZE),
    [currentPage, filteredTransactions]
  )

  return (
    <div className="col-span-full gradient-background rounded-2xl p-4 space-y-4 border border-neutral-800/80">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <div className="text-sm font-medium text-neutral-100">Transaction History</div>
          <div className="text-xs text-neutral-500 mt-1">Cash funding, conversions, and wallet movements.</div>
        </div>
        <div className=" flex  gradient-background rounded-full! p-0! justify-between items-center ">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => {
                setTimeFilter(filter)
                setTxPage(1)
              }}
              className={`px-3 text-xs py-1 rounded-full ${
                timeFilter === filter
                  ? 'bg-green-500 text-neutral-950'
                  : 'text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {filteredTransactions.length > 0 ? (
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full min-w-[840px] text-sm border-separate border-spacing-y-3">
            <thead>
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
              {pagedTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="py-3 pl-2 rounded-l-lg">
                    <MethodCell transaction={transaction} />
                  </td>
                  <td className="py-3 text-neutral-500 truncate max-w-[140px]">
                    {transaction.id.slice(0, 14)}...{transaction.id.slice(-4)}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-1 rounded-full text-[10px] capitalize bg-neutral-800/50">
                      {transaction.type}
                    </span>
                  </td>
                  <td className="py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          transaction.type === 'deposit' || transaction.type === 'interest'
                            ? 'text-green-500'
                            : 'text-red-500'
                        }
                      >
                        {transaction.type === 'deposit' || transaction.type === 'interest' ? '+' : '-'}
                        {transaction.amount} {transaction.method.symbol}
                      </span>
                    </div>
                    <span className="text-neutral-300 text-[8px]">
                      {formatCurrency(transaction.eqAmount, 'USD', 2)}
                    </span>
                    {transaction.note ? (
                      <div className="text-[10px] text-neutral-500 mt-1">{transaction.note}</div>
                    ) : null}
                  </td>
                  <td className="py-3">
                   <GradientBadge tone={transaction.status === 'completed' ? 'green' : transaction.status === 'pending' ? 'amber' : 'red'} size="xs">{transaction.status}</GradientBadge>
                   
                  </td>
                  <td className="py-3 pr-2 rounded-r-lg text-neutral-400">
                    {new Date(transaction.createdAt * 1000).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={currentPage}
            pageSize={TX_PAGE_SIZE}
            totalCount={filteredTransactions.length}
            onPageChange={setTxPage}
          />
        </div>
      ) : (
        <div className="flex justify-center items-center h-full w-full min-h-[180px]">
          <div className="text-neutral-400">No transactions found for this period.</div>
        </div>
      )}
    </div>
  )
}
