import AccountBalance from "../components/wallet/AccountBalance"
import AssetsList from "../components/wallet/AssetsList"
import { UserCoinsProps } from "../types/wallet"
import { useRef } from 'react';


const userCoins: UserCoinsProps[] = [
    {
        coinName: "Bitcoin",
        coinShort: "BTC",
        coinChain: "Bitcoin",
        coinId: "iosdij9j09wefjij",
        walletId: "dfjk9hieurjhgi9isdv",
        price: "84300",
        userBalance: 0.323412,
        change24hrs: "1.132",
        coinColor: "orange",
    },
    {
        coinName: "Ethereum",
        coinShort: "ETH",
        coinChain: "Ethereum",
        coinId: "sdjvi904jij9ifs",
        walletId: "fkvpijhiusd9fvijsijs",
        price: "2480",
        userBalance: 3.98737,
        change24hrs: "-0.02",
        coinColor: "purple",
    },
    {
        coinName: "Tether",
        coinShort: "USDT",
        coinChain: "TRC20",
        coinId: "sdlmfg0ermgoioi",
        walletId: "kd9fhj4w2euifchuw9hjh89",
        price: "1",
        userBalance: 2890,
        change24hrs: "0.121",
        coinColor: "green",
    },
    {
        coinName: "Binance Coin",
        coinShort: "BNB",
        coinChain: "Binance",
        coinId: "sdfg34tgth656th6",
        walletId: "oodsj0aoosdjk9jidjsgfeg3",
        price: "420",
        userBalance: 3.98737,
        change24hrs: "-0.22",
        coinColor: "yellow",
    },
    {
        coinName: "Tron",
        coinShort: "TRX",
        coinChain: "TRX",
        coinId: "hjdf9wuefbnwhfwihef",
        walletId: "wef94fijweiufh9wehfw9uihe",
        price: "0.07",
        userBalance: 1310.32,
        change24hrs: "0.82",
        coinColor: "red",
    }
]

function Wallets() {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
        }
    };

    return (
        <div className="relative">
            <main className="p-6">
                <div className='gap-4  flex max-md:flex-wrap items-center'>
                    <div className="flex">
                        <AccountBalance userCoins={userCoins} />
                    </div>
                    <div className="relative overflow-hidden">
                        <div 
                            ref={scrollContainerRef}
                            className="flex items-center space-x-2 overflow-x-auto scrollbar-none "
                        >
                            <AssetsList userCoins={userCoins} />
                        </div>
                        
                        <div className=" pointer-events-none flex justify-center items-center gap-4 mt-2 max-md:hidden">
                            <button
                                onClick={scrollLeft}
                                className="  z-10 w-8 h-8 flex items-center justify-center !rounded-full gradient-background hover:bg-neutral-700/50 transition-all pointer-events-auto"
                                aria-label="Scroll left"
                            >
                                <i className="fi fi-rr-angle-left text-neutral-300"></i>
                            </button>

                            <button
                                onClick={scrollRight}
                                className="  z-10 w-8 h-8 flex items-center justify-center !rounded-full gradient-background hover:bg-neutral-700 transition-all pointer-events-auto"
                                aria-label="Scroll right"
                            >
                                <i className="fi fi-rr-angle-right text-neutral-300"></i>
                            </button>
                        </div>
                    </div>
                </div>

            </main>

        </div>
    )
}

export default Wallets