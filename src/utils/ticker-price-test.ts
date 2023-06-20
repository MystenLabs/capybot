import { BTCtoUSDC, BTCtoUSDT, SUItoUSDT } from "./binance-ticker-price";
import {
  binanceFetchTickers,
  binanceFetchTickersAll,
  bitgetFetchTickers,
  coinbaseprimeFetchTickers,
  krakenFetchTickers,
  kucoinFetchTickers,
  okxFetchTickers,
} from "./ccxt-fetchTickers";

let BTCtoUSDTprice: string;
let BTCtoUSDCprice: string;
let SUItoUSDTprice: string;

let map = new Map();

let binanceMap = new Map();
let bitgetMap = new Map();
let coinbaseprimeMap = new Map();
let krakenMap = new Map();
let kucoinMap = new Map();
let okxMap = new Map();

const getBTCtoUSDTprice = async () => {
  BTCtoUSDTprice = await BTCtoUSDT();
};

const getBTCtoUSDCprice = async () => {
  BTCtoUSDCprice = await BTCtoUSDC();
};

const getSUItoUSDTprice = async () => {
  SUItoUSDTprice = await SUItoUSDT();
};

const getCCXTBinanceTickers = async () => {
  binanceMap = await binanceFetchTickers([
    "BTC/USDC",
    "SUI/USDT",
    "SUI/TUSD",
    "SUI/BTC",
    "SUI/BNB",
    "SUI/EUR",
    "SUI/TRY",
  ]);
};

const getCCXTBitgetTickers = async () => {
  bitgetMap = await bitgetFetchTickers(["SUI/USDT"]);
};

const getCCXTCoinbaseprimeTickers = async () => {
  coinbaseprimeMap = await coinbaseprimeFetchTickers(["SUI/USD"]);
};

const getCCXTKrakenTickers = async () => {
  krakenMap = await krakenFetchTickers(["SUI/EUR", "SUI/USD"]);
};

const getCCXTKucoinTickers = async () => {
  kucoinMap = await kucoinFetchTickers(["SUI/USDT"]);
};

const getCCXTOkxTickers = async () => {
  okxMap = await okxFetchTickers(["SUI/USDT"]);
};

const getCCXTBinanceTickersAll = async () => {
  map = await binanceFetchTickersAll();
};

getBTCtoUSDCprice().then(() => {
  console.log(BTCtoUSDCprice);
});

getBTCtoUSDTprice().then(() => {
  console.log(BTCtoUSDTprice);
});

getSUItoUSDTprice().then(() => {
  console.log(SUItoUSDTprice);
});

getCCXTBinanceTickers().then(() => {
  console.log(binanceMap);
});

getCCXTCoinbaseprimeTickers().then(() => {
  console.log(coinbaseprimeMap);
});

getCCXTKrakenTickers().then(() => {
  console.log(krakenMap);
});

getCCXTOkxTickers().then(() => {
  console.log(okxMap);
});

getCCXTKucoinTickers().then(() => {
  console.log(kucoinMap);
});

getCCXTBitgetTickers().then(() => {
  console.log(bitgetMap);
});
