import { BTCtoUSDC, BTCtoUSDT, SUItoUSDT } from "./binance-ticker-price";
import {
  binanceFetchTickers,
  binanceFetchTickersAll,
} from "./ccxt-fetchTickers";

let BTCtoUSDTprice: string;
let BTCtoUSDCprice: string;
let SUItoUSDTprice: string;
let map = new Map();

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
  map = await binanceFetchTickers(["BTC/USDT", "BTC/USDC", "SUI/USDT"]);
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
  console.log(map);
});
