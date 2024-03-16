import {
    Dictionary,
    Ticker,
    binance,
    bitget,
    coinbaseprime,
    kraken,
    kucoin,
    okx,
} from 'ccxt'

const binanceExchange = new binance({ enableRateLimit: true })
const bitgetExchange = new bitget({ enableRateLimit: true })
const coinbaseprimeExchange = new coinbaseprime({ enableRateLimit: true })
const krakenExchange = new kraken({ enableRateLimit: true })
const kucoinExchange = new kucoin({ enableRateLimit: true })
const okxExchange = new okx({ enableRateLimit: true })

// This function fetches tickers from an exchange
async function exchangeFetchTickers(
    exchange: binance | bitget | coinbaseprime | kraken | kucoin | okx,
    pairs: string[]
): Promise<Map<string, number | undefined>> {
    const map = new Map<string, number | undefined>()

    const response: Dictionary<Ticker> = await exchange.fetchTickers(pairs)
    for (let pair in response)
        map.set(response[pair].symbol, response[pair].last)

    return map
}

// This function fetches tickers from Binance exchange
export async function binanceFetchTickers(pairs: string[]) {
    return await exchangeFetchTickers(binanceExchange, pairs)
}

// This function fetches tickers from Bitget exchange
export async function bitgetFetchTickers(pairs: string[]) {
    return await exchangeFetchTickers(bitgetExchange, pairs)
}

// This function fetches tickers from Coinbase Prime exchange
export async function coinbaseprimeFetchTickers(pairs: string[]) {
    return await exchangeFetchTickers(coinbaseprimeExchange, pairs)
}

// This function fetches tickers from Kraken exchange
export async function krakenFetchTickers(pairs: string[]) {
    return await exchangeFetchTickers(krakenExchange, pairs)
}

// This function fetches tickers from Kucoin exchange
export async function kucoinFetchTickers(pairs: string[]) {
    return await exchangeFetchTickers(kucoinExchange, pairs)
}

// This function fetches tickers from Okx exchange
export async function okxFetchTickers(pairs: string[]) {
    return await exchangeFetchTickers(okxExchange, pairs)
}

// This function fetches all tickers from Binance exchange
export async function binanceFetchTickersAll() {
    const map = new Map()

    // const fetchedTickers: Dictionary<Ticker> =
    //   await binanceExchange.fetchTickers();
    // for (let i = 0; i < fetchedTickers.length; i++)
    //   map.set(fetchedTickers[i].symbol, fetchedTickers[i].last);

    return map
}
