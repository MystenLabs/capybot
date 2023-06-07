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
    const jsonData = JSON.parse(fs.readFileSync('coins/coins.json', 'utf-8'));
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

// Convenience map from name to address for commonly used coins
export const coins = {
    SUI: '0x2::sui::SUI',
    USDC: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
    CETUS: '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
    CETUS0: '0x6864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
    BRT: '0x5580c843b6290acb2dbc7d5bf8ab995d4d4b6ba107e2a283b4d481aab1564d68::brt::BRT',
    WETH: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
    TOCE: '0xd2013e206f7983f06132d5b61f7c577638ff63171221f4f600a98863febdfb47::toce::TOCE',
    USDT: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
}

// Setup default amount to trade for each token in each pool. Set to approximately 10 USD each.
export const defaultAmount: Record<string, number> = {}
defaultAmount[coins.SUI] = 10_000_000_000;
defaultAmount[coins.USDC] = 10_000_000;
defaultAmount[coins.CETUS] = 150_000_000_000;
defaultAmount[coins.CETUS0] = 150_000_000_000;
defaultAmount[coins.BRT] = 1500_000_000_000_000;
defaultAmount[coins.WETH] = 1000_000;
defaultAmount[coins.TOCE] = 1_000_000_000_000;
defaultAmount[coins.USDT] = 10_000_000;
