const ccxt = require("ccxt");

const binance = new ccxt.binance({ enableRateLimit: true });
const bitget = new ccxt.bitget({ enableRateLimit: true });
const coinbaseprime = new ccxt.coinbaseprime({ enableRateLimit: true });
const kraken = new ccxt.kraken({ enableRateLimit: true });
const kucoin = new ccxt.kucoin({ enableRateLimit: true });
const okx = new ccxt.okx({ enableRateLimit: true });

// This function fetches tickers from an exchange
const exchangeFetchTickers = async function (exchange, pairs) {
  const map = new Map();

  const response = await exchange.fetchTickers(pairs);
  for (let pair in response)
    map.set(response[pair].symbol, response[pair].last);

  return map;
};

// This function fetches tickers from Binance exchange
export const binanceFetchTickers = async function (pairs) {
  return await exchangeFetchTickers(binance, pairs);
};

// This function fetches tickers from Bitget exchange
export const bitgetFetchTickers = async function (pairs) {
  return await exchangeFetchTickers(bitget, pairs);
};

// This function fetches tickers from Coinbase Prime exchange
export const coinbaseprimeFetchTickers = async function (pairs) {
  return await exchangeFetchTickers(coinbaseprime, pairs);
};

// This function fetches tickers from Kraken exchange
export const krakenFetchTickers = async function (pairs) {
  return await exchangeFetchTickers(kraken, pairs);
};

// This function fetches tickers from Kucoin exchange
export const kucoinFetchTickers = async function (pairs) {
  return await exchangeFetchTickers(kucoin, pairs);
};

// This function fetches tickers from Okx exchange
export const okxFetchTickers = async function (pairs) {
  return await exchangeFetchTickers(okx, pairs);
};

// This function fetches all tickers from Binance exchange
export const binanceFetchTickersAll = async function () {
  const map = new Map();

  const fetchedTickers = await binance.fetchTickers();
  for (let i = 0; i < fetchedTickers.length; i++)
    map.set(fetchedTickers[i].symbol, fetchedTickers[i].last);

  return map;
};
