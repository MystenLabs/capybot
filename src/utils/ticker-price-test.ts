import { BTCtoUSDC, BTCtoUSDT } from "./binance-ticker-price";
import {
  binanceFetchTickers,
  binanceFetchTickersAll,
} from "./ccxt-fetchTickers";

let BTCtoUSDTprice: string;
let BTCtoUSDCprice: string;
let map = new Map();

const getBTCtoUSDTprice = async () => {
  BTCtoUSDTprice = await BTCtoUSDT();
};

const getBTCtoUSDCprice = async () => {
  BTCtoUSDCprice = await BTCtoUSDC();
};

const getCCXTBinanceTickers = async () => {
  map = await binanceFetchTickers(["BTC/USDT", "BTC/USDC"]);
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

getCCXTBinanceTickers().then(() => {
  console.log(map);
});
