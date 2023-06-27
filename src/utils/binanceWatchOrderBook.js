const ccxt = require("ccxt");

const exchange = new ccxt.pro.binance({ enableRateLimit: true });
const symbols = ["BTC/USDT", "BTC/USD"];

export const binanceWatchOrderBook = async function (symbol) {
  try {
    const orderbook = await exchange.watchOrderBook(symbol);
    console.log(new Date(), symbol, orderbook["asks"][0][0], orderbook["bids"][0][0]);
  } catch (e) {
    console.log(symbol, e);
  }
};
