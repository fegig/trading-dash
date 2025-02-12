import { formatNumber } from "../util/formatCurrency";

export interface CoinData {
  time: number;
  open: number;
  close: number;
  price: number;
  high: number;
  low: number;
  volumefrom: number;
  volumeto: number;
  change24hrs: number;
}

interface CoinBio {
  coinId: string;
  coinName: string;
  coinShort: string;
  coinChain: string;
  confirmLevel: number;
  price: string;
  change24hrs: string;
  volume24hrs: string;
  supply: string;
  marketCapital: string;
  circulatingSupply: string;
  openDay: string;
  highDay: string;
  lowDay: string;
}

interface ApiResponse<T> {
  Data: {
    Data: T[];
  };
  RAW?: {
    [key: string]: {
      [currency: string]: PriceData;
    };
  };
}

interface PriceData {
  PRICE: number;
  CHANGEPCT24HOUR: number;
  VOLUME24HOUR: number;
  SUPPLY: number;
  MKTCAP: number;
  CIRCULATINGSUPPLY: number;
  OPENDAY: number;
  HIGHDAY: number;
  LOWDAY: number;
}

interface HistoricalData {
  time: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volumefrom: number;
  volumeto: number;
}



export interface CoinReturn{
    info: CoinBio;
    hChanges: CoinData[],
    dChanges: CoinData[],
    wChanges: CoinData[],
    mChanges: CoinData[],
    yChanges: CoinData[],
}


const API_KEY = "14f7bea0a9c7286dd68d0f5483346e50658b4343db0b9c1993aae5feed931297";
const BASE_URL = "https://min-api.cryptocompare.com/data";



const fetchApi = async <T>(endpoint: string): Promise<T> => {
  const response = await fetch(
    `${BASE_URL}${endpoint}&api_key=${API_KEY}`
  );
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }
  return response.json();
};

const processHistoricalData = (data: HistoricalData[]): CoinData[] => {
  return data.map((item) => ({
    time: item.time,
    open: item.open,
    close: item.close,
    price: item.close,
    high: item.high,
    low: item.low,
    volumefrom: item.volumefrom,
    volumeto: item.volumeto,
    change24hrs: item.close - item.open,
  }));
};

const getHistoricalData = async (base: string, quote: string, endpoint: string, limit: number): Promise<CoinData[]> => {
  const response = await fetchApi<ApiResponse<HistoricalData>>(
    `${endpoint}?fsym=${base}&tsym=${quote}&limit=${limit}`
  );
  return processHistoricalData(response.Data.Data);
};

const getCoinFromDB = async () => {
  return {
    coin_id: "Babjhbc8ybefbyubas",
    coinShort: "BTC",
    coinName: "Bitcoin",
    coinChain: "Bitcoin",
    confirm_level: 0,
  };
};

const getCoinById = async (base: string, quote: string) => {
  const coin = await getCoinFromDB();
  if (!coin) {
    throw new Error("Coin not found");
  }

  const priceResponse = await fetchApi<ApiResponse<PriceData>>(`/pricemultifull?fsyms=${base}&tsyms=${quote}`
  );

  const coinInfo = priceResponse.RAW?.[base][quote];
  if (!coinInfo) {
    throw new Error("Price data not found for coin");
  }

  const coinBio: CoinBio = {
    coinId: coin.coin_id,
    coinName: coin.coinName,
    coinShort: coin.coinShort,
    coinChain: coin.coinChain,
    confirmLevel: coin.confirm_level,
    price: formatNumber(coinInfo.PRICE),
    change24hrs: formatNumber(coinInfo.CHANGEPCT24HOUR),
    volume24hrs: formatNumber(coinInfo.VOLUME24HOUR),
    supply: formatNumber(coinInfo.SUPPLY),
    marketCapital: formatNumber(coinInfo.MKTCAP),
    circulatingSupply: formatNumber(coinInfo.CIRCULATINGSUPPLY),
    openDay: formatNumber(coinInfo.OPENDAY),
    highDay: formatNumber(coinInfo.HIGHDAY),
    lowDay: formatNumber(coinInfo.LOWDAY),
  };

  const [hourly, daily, weekly, monthly, yearly] = await Promise.all([
    getHistoricalData(base, quote, "/v2/histominute", 60),
    getHistoricalData(base, quote, "/v2/histohour", 24),
    getHistoricalData(base, quote, "/v2/histohour", 168),
    getHistoricalData(base, quote, "/v2/histoday", 30),
    getHistoricalData(base, quote, "/v2/histoday", 365),
  ]);

  return {
    info: coinBio,
    hChanges: hourly,
    dChanges: daily,
    wChanges: weekly,
    mChanges: monthly,
    yChanges: yearly,
  };
};

export {
  getCoinById,
  getHistoricalData
};
