import fs from 'fs'
import path from 'path'

export type Coin = {
    name: string // The name of the coin.
    symbol: string // The symbol of the coin.
    coin_type: string // The type of the coin.
    coingecko_id: string // The ID of the coin on Coingecko.
    decimals: number // The number of decimals for the coin.
    icon_url: string // The URL for the icon of the coin.
    project_url: string // The URL for the project website of the coin.
    source: string
}

/**
 * Returns the coin information for a given coin type.
 * Coin info from coins.json (https://github.com/suiet/sui-coin-list/blob/main/src/coins.json) based on the coin type.
 * @param coin_type The type of the coin.
 * @returns The coin information.
 */
export function getCoinInfo(coin_type: string): Coin {
    const jsonData = JSON.parse(
        fs.readFileSync(path.resolve('src/coins/coins.json'), 'utf-8')
    )
    for (const coin of jsonData) {
        if (coin.coin_type === coin_type) {
            return coin
        }
    }
    return {
        name: coin_type,
        symbol: 'N/A',
        coin_type: coin_type,
        coingecko_id: 'N/A',
        decimals: 0,
        icon_url: 'N/A',
        project_url: 'N/A',
        source: 'N/A',
    }
}
