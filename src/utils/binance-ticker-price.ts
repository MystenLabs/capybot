import { Spot } from '@binance/connector'

// Create a new Binance Spot client.
const client = new Spot()

/**
 * Get the ticker price for a given symbol.
 * @param symbol The symbol to get the ticker price for.
 * @returns The ticker price for the given symbol.
 */
async function getTickerPrice(symbol: string): Promise<string> {
    // Get the ticker price for the given symbol.
    const tickerPrice = await client.tickerPrice(symbol)
    // Return the price data.
    return tickerPrice.data.price
}

/**
 * Get the current BTC to USDT exchange rate.
 * @returns The current BTC to USDT exchange rate.
 */
export async function BTCtoUSDT() {
    // Get the ticker price for BTCUSDT.
    const price = await getTickerPrice('BTCUSDT')
    // Return the price data.
    return price
}

/**
 * Get the current BTC to USDC exchange rate.
 * @returns The current BTC to USDC exchange rate.
 */
export async function BTCtoUSDC() {
    // Get the ticker price for BTCUSDC.
    const price = await getTickerPrice('BTCUSDC')
    // Return the price data.
    return price
}

/**
 * Get the current SUI to USDT exchange rate.
 * @returns The current SUI to USDT exchange rate.
 */
export async function SUItoUSDT() {
    // Get the ticker price for SUIUSDT.
    const price = await getTickerPrice('SUIUSDT')
    // Return the price data.
    return price
}

/**
 * Get the current SUI to TUSD exchange rate.
 * @returns The current SUI to TUSD exchange rate.
 */
export async function SUItoTUSD() {
    // Get the ticker price for SUITUSD.
    const price = await getTickerPrice('SUITUSD')
    // Return the price data.
    return price
}

/**
 * Get the current SUI to BTC exchange rate.
 * @returns The current SUI to BTC exchange rate.
 */
export async function SUItoBTC() {
    // Get the ticker price for SUIBTC.
    const price = await getTickerPrice('SUIBTC')
    // Return the price data.
    return price
}

/**
 * Get the current SUI to BNB exchange rate.
 * @returns The current SUI to BNB exchange rate.
 */
export async function SUItoBNB() {
    // Get the ticker price for SUIBNB.
    const price = await getTickerPrice('SUIBNB')
    // Return the price data.
    return price
}

/**
 * Get the current SUI to EUR exchange rate.
 * @returns The current SUI to EUR exchange rate.
 */
export async function SUItoEUR() {
    // Get the ticker price for SUIEUR.
    const price = await getTickerPrice('SUIEUR')
    // Return the price data.
    return price
}

/**
 * Get the current SUI to TRY exchange rate.
 * @returns The current SUI to TRY exchange rate.
 */
export async function SUItoTRY() {
    // Get the ticker price for SUITRY.
    const price = await getTickerPrice('SUITRY')
    // Return the price data.
    return price
}
