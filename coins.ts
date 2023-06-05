import fs from "fs";

export type Coin = {
    "name": string,
    "symbol": string,
    "coin_type": string,
    "coingecko_id": string,
    "decimals": number,
    "icon_url": string,
    "project_url": string,
    "source": string,
}

/** Get coin info from coins.json (https://github.com/suiet/sui-coin-list/blob/main/src/coins.json) based on the coin type. */
export function getCoinInfo(coin_type: string): Coin {
    const jsonData = JSON.parse(fs.readFileSync('coins.json', 'utf-8'));
    for (const coin of jsonData) {
        if (coin.coin_type === coin_type) {
            return coin;
        }
    }
    return {
        "name": coin_type,
        "symbol": 'N/A',
        "coin_type": coin_type,
        "coingecko_id": 'N/A',
        "decimals": 0,
        "icon_url": 'N/A',
        "project_url": 'N/A',
        "source": 'N/A',
    }
}