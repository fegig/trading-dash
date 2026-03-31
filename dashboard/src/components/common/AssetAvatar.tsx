import type { WalletAssetType } from '@/types/wallet'

type Props = {
  symbol: string
  name: string
  assetType?: WalletAssetType
  iconUrl?: string
  iconClass?: string
  sizeClassName?: string
  textClassName?: string
}

export default function AssetAvatar({
  symbol,
  name,
  assetType = 'crypto',
  iconUrl,
  iconClass,
  sizeClassName = 'w-8 h-8',
  textClassName = 'text-xs',
}: Props) {
  if (iconUrl) {
    return <img src={iconUrl} alt={name} className={`${sizeClassName} rounded-full object-cover`} />
  }

  return (
    <div
      className={`${sizeClassName} rounded-full grid place-items-center bg-neutral-900 border border-neutral-700 text-neutral-200 ${textClassName}`}
      aria-label={name}
      title={name}
    >
      {iconClass ? (
        <i className={iconClass} />
      ) : (
        <span>{assetType === 'fiat' ? symbol.slice(0, 1) : symbol.slice(0, 2)}</span>
      )}
    </div>
  )
}
