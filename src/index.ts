import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519'
import { Capybot } from './capybot'
import { BinanceBTCtoUSDC } from './data_sources/binance/BinanceBTCtoUSDC'
import { CetusPool } from './dexs/cetus/cetus'
import { Arbitrage } from './strategies/arbitrage'
import { MarketDifference } from './strategies/market_difference'
import { RideTheTrend } from './strategies/ride_the_trend'
import { RideTheExternalTrend } from './strategies/ride_the_external_trend'
import { RAMMPool } from './dexs/ramm-sui/ramm-sui'

import { SuiSupportedNetworks, rammSuiConfigs } from '@ramm/ramm-sui-sdk'

// Convenience map from name to address for commonly used coins
export const coins = {
    SUI: '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
    USDC: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
    CETUS: '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
    CETUS0: '0x6864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
    BRT: '0x5580c843b6290acb2dbc7d5bf8ab995d4d4b6ba107e2a283b4d481aab1564d68::brt::BRT',
    WETH: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
    TOCE: '0xd2013e206f7983f06132d5b61f7c577638ff63171221f4f600a98863febdfb47::toce::TOCE',
    USDT: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
    WBTC: '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN',
}

// Setup default amount to trade for each token in each pool. Set to approximately 1 USD each.
export const defaultAmount: Record<string, number> = {}
defaultAmount[coins.SUI] = 1_000_000_000
defaultAmount[coins.USDC] = 1_000_000
defaultAmount[coins.CETUS] = 15_000_000_000
defaultAmount[coins.CETUS0] = 15_000_000_000
defaultAmount[coins.BRT] = 150_000_000_000_000
defaultAmount[coins.WETH] = 100_000
defaultAmount[coins.TOCE] = 100_000_000_000
defaultAmount[coins.USDT] = 1_000_000
defaultAmount[coins.WBTC] = 3_000

// A conservative upper limit on the max gas price per transaction block in SUI
export const MAX_GAS_PRICE_PER_TRANSACTION = 4_400_000

const RIDE_THE_TREND_LIMIT = 1.000005
// Arbitrage threshold - 0.5%, or above
const ARBITRAGE_RELATIVE_LIMIT = 1.005
const MARKET_DIFFERENCE_LIMIT = 1.01

// Setup wallet from passphrase.
const phrase = process.env.ADMIN_PHRASE
export const keypair = Ed25519Keypair.deriveKeypair(phrase!)

let capybot = new Capybot(keypair, 'mainnet')
const cetusUSDCtoSUI = new CetusPool(
    '0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630',
    coins.USDC,
    coins.SUI,
    'mainnet'
)

const cetusCETUStoSUI = new CetusPool(
    "0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded",
    coins.CETUS,
    coins.SUI,
    'mainnet'
);

const cetusUSDCtoCETUS = new CetusPool(
    "0x238f7e4648e62751de29c982cbf639b4225547c31db7bd866982d7d56fc2c7a8",
    coins.USDC,
    coins.CETUS,
    'mainnet'
);

const cetusSUItoUSDT = new CetusPool(
    '0xa96b0178e9d66635ce3576561429acfa925eb388683992288207dbfffde94b65',
    coins.SUI,
    coins.USDT,
    'mainnet'
);

const rammSUItoUSDC = new RAMMPool(
    rammSuiConfigs[SuiSupportedNetworks.mainnet][0],
    '0x4ee5425220bc12f2ff633d37b1dc1eb56cc8fd96b1c72c49bd4ce6e895bd6cd7',
    coins.SUI,
    coins.USDC,
    'mainnet'
)

/* const rammSUItoUSDT = new RAMMPool(
    rammSuiConfigs[SuiSupportedNetworks.mainnet][0],
    '0x4ee5425220bc12f2ff633d37b1dc1eb56cc8fd96b1c72c49bd4ce6e895bd6cd7',
    coins.SUI,
    coins.USDT,
    'mainnet'
) */

capybot.addPool(cetusUSDCtoSUI)
//capybot.addPool(cetusCETUStoSUI)
//capybot.addPool(cetusUSDCtoCETUS)
capybot.addPool(cetusSUItoUSDT)
capybot.addPool(rammSUItoUSDC)
// TODO: fix the way `capybot` stores pool information, so that a RAMM pool with over 2 assets
// can be added more than once e.g. for its `SUI/USDC` and `SUI/USDT` pairs.
//capybot.addPool(rammSUItoUSDT)

capybot.addDataSource(new BinanceBTCtoUSDC())

/* // Add triangular arbitrage strategy: USDC/SUI -> (CETUS/SUI)^-1 -> (USDC/CETUS)^-1.
capybot.addStrategy(
    new Arbitrage(
        [
            {
                pool: cetusUSDCtoSUI.uri,
                a2b: false,
            },
            {
                pool: cetusUSDCtoCETUS.uri,
                a2b: true,
            },
            {
                pool: cetusCETUStoSUI.uri,
                a2b: true,
            },
        ],
        defaultAmount[coins.SUI],
        ARBITRAGE_RELATIVE_LIMIT,
        "Arbitrage: SUI -Cetus-> USDC -Cetus-> CETUS -Cetus-> SUI"
    )
); */

// Add arbitrage strategy: USDC/SUI -> SUI/USDC
capybot.addStrategy(
    new Arbitrage(
        [
            {
                pool: cetusUSDCtoSUI.uri,
                a2b: false,
            },
            {
                pool: rammSUItoUSDC.uri,
                a2b: false,
            }
        ],
        defaultAmount[coins.SUI],
        ARBITRAGE_RELATIVE_LIMIT,
        'Arbitrage: SUI -CETUS-> USDC -RAMM-> SUI'
    )
)

// Start the bot
capybot.loop(3.6e6, 1000)
