const ccxt = require("ccxt");

const binance = new ccxt.binance({ enableRateLimit: true });
const bitget = new ccxt.bitget({ enableRateLimit: true });
const coinbaseprime = new ccxt.coinbaseprime({ enableRateLimit: true });
const kraken = new ccxt.kraken({ enableRateLimit: true });
const kucoin = new ccxt.kucoin({ enableRateLimit: true });
const okx = new ccxt.okx({ enableRateLimit: true });

// Exchange;
const exchangeFetchTickers = async function (exchange, pairs) {
  const map = new Map();

  const response = await exchange.fetchTickers(pairs);
  for (let pair in response)
    map.set(response[pair].symbol, response[pair].last);

  return map;
};

export const binanceFetchTickers = async function (pairs) {
  return await exchangeFetchTickers(binance, pairs);
};

export const bitgetFetchTickers = async function (pairs) {
  return await exchangeFetchTickers(bitget, pairs);
};

export const coinbaseprimeFetchTickers = async function (pairs) {
  return await exchangeFetchTickers(coinbaseprime, pairs);
};

export const krakenFetchTickers = async function (pairs) {
  return await exchangeFetchTickers(kraken, pairs);
};

export const kucoinFetchTickers = async function (pairs) {
  return await exchangeFetchTickers(kucoin, pairs);
};

export const okxFetchTickers = async function (pairs) {
  return await exchangeFetchTickers(okx, pairs);
};

export const binanceFetchTickersAll = async function () {
  const map = new Map();

  const fetchedTickers = await binance.fetchTickers();
  for (let i = 0; i < fetchedTickers.length; i++)
    map.set(fetchedTickers[i].symbol, fetchedTickers[i].last);

  return map;
};
