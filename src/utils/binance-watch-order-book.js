const ccxt = require('ccxt')

const exchange = new ccxt.pro.binance({ enableRateLimit: true })

export const binanceWatchOrderBook = async function (symbol) {
    try {
        const orderbook = await exchange.watchOrderBook(symbol)
        return orderbook['asks'][0][0]
    } catch (e) {
        console.log(symbol, e)
    }
}
