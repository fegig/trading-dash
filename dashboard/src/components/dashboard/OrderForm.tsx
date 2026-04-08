import { useState, useMemo } from "react";
import { formatCurrency } from "@/util/formatCurrency";
import { MarketData } from "./PairBanner";
import { errorToast, successToast } from "@/components/common/sweetAlerts";
import { placeLiveOrder } from "@/services/liveOrderService";
import { useWalletStore } from "@/stores";
import { dispatchTradesRefresh } from "@/util/tradeRefreshEvents";
import Switch from "../common/SwitchOption";

const LITE_LEVERAGE = 5
const LITE_TP_RATIO = 0.02
const LITE_SL_RATIO = 0.01

type TradingType = 'isolated' | 'cross';
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

// Update the OrderForm component props type
interface OrderFormProps {
    symbol: MarketData | null;
    tradingMode?: 'lite' | 'pro';
}

function OrderForm({ symbol, tradingMode = 'pro' }: OrderFormProps) {
    const [tradingType, setTradingType] = useState<TradingType>('isolated');
    const [tradingTypeValue, setTradingTypeValue] = useState<number>(0);
    const [orderType, setOrderType] = useState<OrderType>('market');
    const [longShort, setLongShort] = useState<LongShort>('long');

    const [leverage, setLeverage] = useState('10');
    const [orderPrice, setOrderPrice] = useState('');
    const [triggerPrice, setTriggerPrice] = useState('');
    const [amount, setAmount] = useState('0.01');
    const [postOnly, setPostOnly] = useState(false);

    // Add new state for TP/SL
    const [takeProfitPrice, setTakeProfitPrice] = useState('');
    const [stopLossPrice, setStopLossPrice] = useState('');
    const [maxLeverage] = useState(100); // Maximum leverage allowed
    const [placing, setPlacing] = useState(false);

    // Add new state for TP/SL toggle
    const [tpslEnabled, setTpslEnabled] = useState(false);

    const [liteUsdMargin, setLiteUsdMargin] = useState('50');
    const [liteUseTp, setLiteUseTp] = useState(true);
    const [liteUseSl, setLiteUseSl] = useState(true);

    // Validate leverage input
    const handleLeverageChange = (value: string): void => {
        if (value === '') {
            setLeverage('');
            return;
        }
        const leverageNum = Number(value);
        if (!Number.isFinite(leverageNum)) return;
        if (leverageNum > maxLeverage) {
            errorToast(`Maximum leverage allowed is ${maxLeverage}x`);
            setLeverage(String(maxLeverage));
            return;
        }
        if (leverageNum < 1) {
            setLeverage('1');
            return;
        }
        setLeverage(value);
    };

    const { marginUsage, details } = useMemo(() => {
        const walletBalance = 100000;
        const marginBalance = walletBalance + walletBalance * 0.012;
        const walletUsage = (Number(amount) / walletBalance) * 100;
        const freeMargin = marginBalance - calculateMargin(amount, leverage);

        const marginUsageRows: MarginUsage[] = [
            { name: 'Margin Balance', value: marginBalance.toFixed(2), unit: symbol?.QUOTE },
            { name: 'USDT Wallet balance', value: walletBalance.toFixed(2), unit: symbol?.QUOTE },
            { name: 'USDT Wallet usage', value: `${walletUsage.toFixed(1)}%`, unit: symbol?.QUOTE },
            { name: 'Max Cross Margin', value: '+300', unit: symbol?.QUOTE },
            { name: 'Unrealized PnL', value: '+12%', unit: symbol?.QUOTE },
            { name: 'Free Margin', value: freeMargin.toFixed(2), unit: symbol?.QUOTE },
        ];

        const rawPrice = orderType === 'market' ? symbol?.PRICE ?? 0 : Number(orderPrice);
        const priceNum = Number.isFinite(rawPrice) && rawPrice > 0 ? rawPrice : 0;
        const priceStr = priceNum.toString();
        const levStr = leverage === '' ? '1' : leverage;

        const commission = calculateCommission(amount, priceStr, 0);
        const liquidationPrice = calculateLiquidationPrice(priceStr, levStr, longShort);
        const marginRequired = calculateMargin(amount, levStr);
        const maxPosition = calculateMaxPosition(marginBalance, levStr);
        const levN = Number(levStr) || 1;
        const marginUsd =
            priceNum > 0 && Number(amount) > 0 ? (Number(amount) * priceNum) / levN : 0;

        const detailRows: Detail[] = [
            { name: 'Commission', value: commission.toFixed(2), unit: symbol?.QUOTE },
            { name: 'Av Liquidation Price', value: liquidationPrice.toFixed(2), unit: symbol?.QUOTE },
            {
                name: 'Est. margin (USD)',
                value: marginUsd > 0 ? formatCurrency(marginUsd, 'USD') : marginRequired.toFixed(2),
                unit: marginUsd > 0 ? undefined : symbol?.QUOTE,
            },
            { name: 'Max Position Amount', value: maxPosition.toFixed(2), unit: symbol?.QUOTE },
        ];

        return { marginUsage: marginUsageRows, details: detailRows };
    }, [amount, leverage, orderPrice, orderType, longShort, symbol]);

    const litePreview = useMemo(() => {
        if (tradingMode !== 'lite') return null;
        const p = symbol?.PRICE ?? 0;
        const m = Number(liteUsdMargin);
        if (!(p > 0) || !(m > 0)) return null;
        const base = (m * LITE_LEVERAGE) / p;
        const tp =
            liteUseTp && longShort === 'long'
                ? p * (1 + LITE_TP_RATIO)
                : liteUseTp && longShort === 'short'
                  ? p * (1 - LITE_TP_RATIO)
                  : null;
        const sl =
            liteUseSl && longShort === 'long'
                ? p * (1 - LITE_SL_RATIO)
                : liteUseSl && longShort === 'short'
                  ? p * (1 + LITE_SL_RATIO)
                  : null;
        return { base, tp, sl, price: p };
    }, [tradingMode, symbol?.PRICE, liteUsdMargin, longShort, liteUseTp, liteUseSl]);

    const finishOrderResponse = (res: unknown) => {
        const status = res && typeof res === 'object' && 'status' in res ? (res as { status?: number }).status : undefined;
        if (status && status >= 400) {
            const msg = (res as { data?: { error?: string } })?.data?.error;
            errorToast(msg ?? 'Order rejected. Check session and balance.');
            return;
        }
        successToast('Order placed successfully');
        void useWalletStore.getState().loadWallet(true);
        dispatchTradesRefresh();
    };

    // Update place order handler
    const handlePlaceOrder = (): void => {
        if (!symbol?.BASE || !symbol?.QUOTE) {
            errorToast('Please select a trading pair');
            return;
        }

        if (tradingMode === 'lite') {
            const price = symbol.PRICE ?? 0;
            if (!(price > 0)) {
                errorToast('Waiting for live price. Check connection or wait for the chart to load.');
                return;
            }
            const marginUsd = Number(liteUsdMargin);
            if (!Number.isFinite(marginUsd) || marginUsd <= 0) {
                errorToast('Enter a valid USD margin amount');
                return;
            }
            const lev = LITE_LEVERAGE;
            const amountBase = (marginUsd * lev) / price;
            if (!(amountBase > 0)) {
                errorToast('Amount too small for this price');
                return;
            }
            const { assets, displayCurrency } = useWalletStore.getState();
            const fiatRow = assets.find((a) => a.assetType === 'fiat');
            const usdBuyingPower =
                fiatRow && displayCurrency.usdPerUnit > 0
                    ? fiatRow.userBalance * displayCurrency.usdPerUnit
                    : 0;
            if (usdBuyingPower > 0 && marginUsd > usdBuyingPower + 1e-6) {
                errorToast(
                    `Not enough buying power. Margin ${formatCurrency(marginUsd, 'USD')} vs ~${formatCurrency(usdBuyingPower, 'USD')} USD available.`
                );
                return;
            }
            const takeProfitPrice = liteUseTp
                ? longShort === 'long'
                    ? price * (1 + LITE_TP_RATIO)
                    : price * (1 - LITE_TP_RATIO)
                : undefined;
            const stopLossPrice = liteUseSl
                ? longShort === 'long'
                    ? price * (1 - LITE_SL_RATIO)
                    : price * (1 + LITE_SL_RATIO)
                : undefined;
            const pair = `${symbol.BASE}-${symbol.QUOTE}`.toUpperCase();
            setPlacing(true);
            void placeLiveOrder({
                pair,
                side: longShort === 'long' ? 'buy' : 'sell',
                type: 'market',
                amount: amountBase,
                leverage: lev,
                marginType: 'isolated',
                price,
                takeProfitPrice,
                stopLossPrice,
            })
                .then(finishOrderResponse)
                .catch(() => {
                    errorToast('Could not place order. Is the API running?');
                })
                .finally(() => setPlacing(false));
            return;
        }

        if (!amount || Number(amount) <= 0) {
            errorToast('Please enter a valid amount');
            return;
        }

        const effectiveLeverage = Math.max(1, Math.min(maxLeverage, Number(leverage) || 1));

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

        const priceForMargin =
            orderType === 'market' ? symbol.PRICE ?? 0 : Number(orderPrice);
        const priceOk = Number.isFinite(priceForMargin) && priceForMargin > 0;
        const marginUsdEst =
            priceOk && Number(amount) > 0
                ? (Number(amount) * priceForMargin) / effectiveLeverage
                : 0;

        const { assets, displayCurrency } = useWalletStore.getState();
        const fiatRow = assets.find((a) => a.assetType === 'fiat');
        const usdBuyingPower =
            fiatRow && displayCurrency.usdPerUnit > 0
                ? fiatRow.userBalance * displayCurrency.usdPerUnit
                : 0;

        if (marginUsdEst > 0 && usdBuyingPower > 0 && marginUsdEst > usdBuyingPower + 1e-6) {
            errorToast(
                `Not enough buying power. Est. margin ${formatCurrency(marginUsdEst, 'USD')} vs ~${formatCurrency(usdBuyingPower, 'USD')} USD available (size is in ${symbol.BASE}, not USD).`
            );
            return;
        }

        const pair = `${symbol.BASE}-${symbol.QUOTE}`.toUpperCase();
        const refPx =
            orderType === 'market'
                ? symbol.PRICE && symbol.PRICE > 0
                    ? symbol.PRICE
                    : Number(orderPrice)
                : Number(orderPrice);
        const DEFAULT_TP_RATIO = 0.02;
        const DEFAULT_SL_RATIO = 0.01;
        const defTpSl = (): { tp: number; sl: number } | null => {
            if (!(refPx > 0) || !Number.isFinite(refPx)) return null;
            if (longShort === 'long') {
                return {
                    tp: refPx * (1 + DEFAULT_TP_RATIO),
                    sl: refPx * (1 - DEFAULT_SL_RATIO),
                };
            }
            return {
                tp: refPx * (1 - DEFAULT_TP_RATIO),
                sl: refPx * (1 + DEFAULT_SL_RATIO),
            };
        };
        const defaults = defTpSl();
        let tp: number | undefined;
        let sl: number | undefined;
        if (tpslEnabled) {
            const tIn = Number(takeProfitPrice);
            const sIn = Number(stopLossPrice);
            tp = tIn > 0 ? tIn : defaults?.tp;
            sl = sIn > 0 ? sIn : defaults?.sl;
        } else if (defaults) {
            tp = defaults.tp;
            sl = defaults.sl;
        }
        setPlacing(true);
        void placeLiveOrder({
            pair,
            side: longShort === 'long' ? 'buy' : 'sell',
            type: orderType,
            amount: Number(amount),
            leverage: effectiveLeverage,
            price:
                orderType === 'market' && refPx > 0
                    ? refPx
                    : orderType !== 'market'
                      ? Number(orderPrice)
                      : undefined,
            marginType: tradingType,
            takeProfitPrice: tp,
            stopLossPrice: sl,
        })
            .then(finishOrderResponse)
            .catch(() => {
                errorToast('Could not place order. Is the API running?');
            })
            .finally(() => setPlacing(false));
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

            {tradingMode === 'lite' ? (
                <div className="rounded-2xl border border-green-500/25 bg-green-500/8 p-3 space-y-1">
                    <div className="text-xs font-semibold text-green-300">Lite mode</div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                        Preset market order at the <span className="text-neutral-300">same price as the chart</span>{' '}
                        ({LITE_LEVERAGE}× isolated, USD margin). Optional ±2% TP / ±1% SL vs. that price; if you turn them off,
                        the server still applies the same default bands so positions can auto-close. The order book on the right
                        re-syncs to your fill price for TP/SL checks (~10s).
                    </p>
                </div>
            ) : null}

            <div className="border-b border-neutral-500/30 space-y-4 pb-4">
                {tradingMode === 'pro' ? (
                    <div className="flex items-center justify-between gradient-background rounded-full! p-0!">
                        <div className="flex-1 max-w-[50%]">
                            <select
                                className="w-full outline-0 border-0 px-3 py-2 text-neutral-500 capitalize text-xs text-center"
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTradingType(e.target.value as TradingType)}
                            >
                                {['isolated', 'cross'].map((type) => (
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
                ) : null}

                <div className="flex  gradient-background p-0! rounded-full!">
                    {['long', 'short'].map((type) => (
                        <button
                            type="button"
                            className={`flex-1 capitalize text-neutral-500 py-2 text-xs  transition-all rounded-full ${longShort === type ? 'bg-green-500 text-neutral-950' : 'text-neutral-500'}`}
                            key={type}
                            onClick={() => setLongShort(type as LongShort)}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {tradingMode === 'pro' ? (
                    <div className="flex gradient-background p-0! rounded-full!">
                        {['market', 'limit', 'stop'].map((type) => (
                            <button
                                type="button"
                                className={`flex-1  capitalize text-neutral-500 py-2 text-xs rounded-full  transition-all ${orderType === type ? 'bg-green-500 text-neutral-950' : 'text-neutral-500'}`}
                                key={type}
                                onClick={() => setOrderType(type as OrderType)}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-[11px] text-neutral-500 py-1">
                        Market order · {LITE_LEVERAGE}× leverage · Isolated margin
                    </div>
                )}
            </div>

            <div className="space-y-4 border-b border-neutral-500/30 pb-4">
                {tradingMode === 'lite' ? (
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <label className="text-sm text-neutral-500">Margin to use (USD)</label>
                            <input
                                type="number"
                                className="w-full text-white font-medium text-sm px-3 py-2 rounded-xl bg-neutral-900/80 border border-neutral-800"
                                value={liteUsdMargin}
                                onChange={(e) => {
                                    const v = e.target.value
                                    if (/^\d*\.?\d*$/.test(v)) setLiteUsdMargin(v)
                                }}
                                min="0"
                                step="any"
                            />
                            <p className="text-[11px] text-neutral-500">
                                Position size in {symbol?.BASE ?? 'base'} is computed as (margin × {LITE_LEVERAGE}) ÷ price.
                            </p>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Switch isOn={liteUseTp} onToggle={() => setLiteUseTp(!liteUseTp)} />
                                <span className="text-xs text-neutral-400">Take profit +2%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch isOn={liteUseSl} onToggle={() => setLiteUseSl(!liteUseSl)} />
                                <span className="text-xs text-neutral-400">Stop loss −1%</span>
                            </div>
                        </div>
                        {litePreview ? (
                            <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-3 text-[11px] text-neutral-400 space-y-1">
                                <div>
                                    Est. size:{' '}
                                    <span className="text-neutral-200 tabular-nums">
                                        {litePreview.base.toFixed(6)} {symbol?.BASE}
                                    </span>
                                </div>
                                {litePreview.tp != null ? (
                                    <div>TP ≈ {formatCurrency(litePreview.tp, 'USD')}</div>
                                ) : null}
                                {litePreview.sl != null ? (
                                    <div>SL ≈ {formatCurrency(litePreview.sl, 'USD')}</div>
                                ) : null}
                            </div>
                        ) : (
                            <p className="text-[11px] text-amber-500/90">Enter margin and wait for a live price to preview size and TP/SL.</p>
                        )}
                    </div>
                ) : null}

                {tradingMode === 'pro' ? (
                <>
                <div className="flex items-center justify-between space-x-2">


                    <div className="flex-1 max-w-[50%] space-y-2">
                        <label className="text-sm text-neutral-500">Trigger Price</label>
                        <div className="gradient-background p-0! ">
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
                        <div className="gradient-background p-0! ">
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
                    <div className="gradient-background p-0! flex items-center justify-between ">
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
                    <div className="flex flex-col gap-0.5">
                        <label className="text-sm text-neutral-500">Position Amount</label>
                        <span className="text-[11px] text-neutral-500 leading-snug">
                            Size in <span className="text-neutral-300">{symbol?.BASE ?? 'base'}</span> units (not USD).
                            Margin is charged in USD equivalent from your fiat wallet.
                        </span>
                    </div>


                    <div className="gradient-background p-0! flex items-center justify-between ">
                        <input
                            type="number"
                            placeholder="0.01"
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
                        <div className="gradient-background p-0!">



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
                                <div className="gradient-background p-0!">
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
                        <select className="w-full text-white font-medium text-xs text-left py-2 rounded-full p-0!">
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
                </>
                ) : null}

            </div>

            <div className="space-y-4 border-b border-neutral-500/30 pb-4">
                {tradingMode === 'pro' ? (
                    <div className="flex flex-col space-y-1">
                        {details.map((type, index) => (
                            <div className="flex items-center justify-between" key={index}>
                                <div className="text-xs text-neutral-500">{type.name}</div>
                                <div className="text-xs text-white">
                                    {type.value}{' '}
                                    <span className="text-xs text-neutral-500">{type.unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}
                <button
                    type="button"
                    className="w-full bg-green-500 text-neutral-950 py-3 rounded-lg font-bold hover:bg-green-600 text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    onClick={handlePlaceOrder}
                    disabled={placing}
                >
                    {placing ? (
                        <>
                            <i className="fi fi-rr-spinner animate-spin" />
                            <span>Placing…</span>
                        </>
                    ) : (
                        tradingMode === 'lite' ? 'Place quick order' : 'Place Order'
                    )}
                </button>
            </div>
            {tradingMode === 'pro' ? (
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
            ) : null}



        </div>

    )

}


export default OrderForm