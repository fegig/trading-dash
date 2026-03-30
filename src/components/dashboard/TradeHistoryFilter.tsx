import type { TradeStatus } from "@/types/trade"
import { useState, type Dispatch, type SetStateAction } from "react"
import Dropdown from "../common/Dropdown"
import Switch from "../common/SwitchOption"
import { Link } from "react-router"

export type HistoryType = Record<TradeStatus, boolean>

type TradeHistoryFilterProps = {
  historyType: HistoryType
  setHistoryType: Dispatch<SetStateAction<HistoryType>>
  showAllTrades?: boolean
}

export default function TradeHistoryFilter({
  historyType,
  setHistoryType,
  showAllTrades,
}: TradeHistoryFilterProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleTypeToggle = (key: TradeStatus) => {
    setHistoryType((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const getActiveTypesText = () => {
    const activeTypes = Object.entries(historyType)
      .filter(([, value]) => value)
      .map(([key]) => key)
      .join(', ')
    return activeTypes || 'Select Types'
  }

  return (
    <div className="flex justify-between items-center gap-3">
      <div className="gradient-background p-2! rounded-lg relative z-10">
        <Dropdown
          isOpen={isDropdownOpen}
          onClose={() => setIsDropdownOpen(false)}
          trigger={
            <button
              type="button"
              onClick={() => setIsDropdownOpen(true)}
              className="flex items-center justify-between hover:opacity-80 w-36"
            >
              <span className="text-xs font-medium capitalize truncate">{getActiveTypesText()}</span>
              <i
                className={`fi fi-rr-angle-down text-xs ${
                  isDropdownOpen ? 'rotate-180' : ''
                } transition-all duration-300 ml-2 shrink-0`}
              />
            </button>
          }
          items={[
            { key: 'open', label: 'Open' },
            { key: 'pending', label: 'Pending' },
            { key: 'canceled', label: 'Canceled' },
            { key: 'completed', label: 'Completed' },
          ]}
          renderItem={(item) => (
            <div className="flex items-center gap-2 px-4 py-2 hover:bg-neutral-800 rounded cursor-pointer">
              <Switch
                isOn={historyType[item.key as TradeStatus]}
                onToggle={() => handleTypeToggle(item.key as TradeStatus)}
              />
              <span className="capitalize text-xs">{item.label}</span>
            </div>
          )}
        />
      </div>

      {showAllTrades && (
        <Link
        to="/trades"
        className="gradient-background rounded-lg px-3! py-2! text-xs text-neutral-400 hover:text-green-400 flex items-center gap-2 transition-colors"
      >
        <i className="fi fi-rr-exchange text-sm" />
        <span>All trades</span>
      </Link>
      )}
    </div>
  )
}
