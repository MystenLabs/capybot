const ccxt = require("ccxt");

const exchange = new ccxt.binance({ enableRateLimit: true });

export const binanceFetchTickers = async function (pairs) {
  const map = new Map();

  const response = await exchange.fetchTickers(pairs);
  for (let pair in response)
    map.set(response[pair].symbol, response[pair].last);

  return map;
};

export const binanceFetchTickersAll = async function () {
  const map = new Map();

  const response = await exchange.fetchTickers();
  for (i = 0; i < response.length; i++)
    map.set(response[i].symbol, response[i].last);

  return map;
};
