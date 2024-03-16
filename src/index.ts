import { Ed25519Keypair } from '@mysten/sui.js'
import { Capybot } from './capybot'
import { BinanceBTCtoUSDC } from './data_sources/binance/BinanceBTCtoUSDC'
import { CetusPool } from './dexs/cetus/cetus'
import { TurbosPool } from './dexs/turbos/turbos'
import { Arbitrage } from './strategies/arbitrage'
import { MarketDifference } from './strategies/market_difference'
import { RideTheTrend } from './strategies/ride_the_trend'
import { RideTheExternalTrend } from './strategies/ride_the_external_trend'

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
const ARBITRAGE_RELATIVE_LIMIT = 1.0001
const MARKET_DIFFERENCE_LIMIT = 1.01

// Setup wallet from passphrase.
const phrase = process.env.ADMIN_PHRASE
export const keypair = Ed25519Keypair.deriveKeypair(phrase!)

let capybot = new Capybot(keypair)
const cetusUSDCtoSUI = new CetusPool(
    '0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630',
    coins.USDC,
    coins.SUI
)
const cetusCETUStoSUI = new CetusPool(
    '0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded',
    coins.CETUS,
    coins.SUI
)
const cetusUSDCtoCETUS = new CetusPool(
    '0x238f7e4648e62751de29c982cbf639b4225547c31db7bd866982d7d56fc2c7a8',
    coins.USDC,
    coins.CETUS
)
const turbosSUItoUSDC = new TurbosPool(
    '0x5eb2dfcdd1b15d2021328258f6d5ec081e9a0cdcfa9e13a0eaeb9b5f7505ca78',
    coins.SUI,
    coins.USDC,
    '0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1::fee3000bps::FEE3000BPS'
)
const cetusWBTCtoUSDC = new CetusPool(
    '0xaa57c66ba6ee8f2219376659f727f2b13d49ead66435aa99f57bb008a64a8042',
    coins.WBTC,
    coins.USDC
)

capybot.addPool(cetusUSDCtoSUI)
capybot.addPool(cetusCETUStoSUI)
capybot.addPool(cetusUSDCtoCETUS)
capybot.addPool(turbosSUItoUSDC)
capybot.addPool(cetusWBTCtoUSDC)
capybot.addDataSource(new BinanceBTCtoUSDC())

// Trend riding strategies
capybot.addStrategy(
    new RideTheTrend(
        cetusUSDCtoSUI.uri,
        5,
        10,
        [
            defaultAmount[cetusUSDCtoSUI.coinTypeA],
            defaultAmount[cetusUSDCtoSUI.coinTypeB],
        ],
        RIDE_THE_TREND_LIMIT,
        'RideTheTrend (USDC/SUI)'
    )
)
capybot.addStrategy(
    new RideTheTrend(
        cetusCETUStoSUI.uri,
        5,
        10,
        [
            defaultAmount[cetusCETUStoSUI.coinTypeA],
            defaultAmount[cetusCETUStoSUI.coinTypeB],
        ],
        RIDE_THE_TREND_LIMIT,
        'RideTheTrend (CETUS/SUI)'
    )
)
capybot.addStrategy(
    new RideTheTrend(
        cetusUSDCtoCETUS.uri,
        5,
        10,
        [
            defaultAmount[cetusUSDCtoCETUS.coinTypeA],
            defaultAmount[cetusUSDCtoCETUS.coinTypeB],
        ],
        RIDE_THE_TREND_LIMIT,
        'RideTheTrend (USDC/CETUS)'
    )
)

// Add triangular arbitrage strategy: USDC/SUI -> (CETUS/SUI)^-1 -> (USDC/CETUS)^-1.
capybot.addStrategy(
    new Arbitrage(
        [
            {
                pool: turbosSUItoUSDC.uri,
                a2b: true,
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
        'Arbitrage: SUI -Turbos-> USDC -Cetus-> CETUS -Cetus-> SUI'
    )
)

capybot.addStrategy(
    new Arbitrage(
        [
            {
                pool: turbosSUItoUSDC.uri,
                a2b: true,
            },
            {
                pool: cetusUSDCtoSUI.uri,
                a2b: true,
            },
        ],
        defaultAmount[coins.SUI],
        ARBITRAGE_RELATIVE_LIMIT,
        'Arbitrage: SUI -Turbos-> USDC -Cetus-> SUI'
    )
)

capybot.addStrategy(
    new MarketDifference(
        cetusWBTCtoUSDC,
        'BinanceBTCtoUSDC',
        [defaultAmount[coins.WBTC], defaultAmount[coins.USDC]],
        MARKET_DIFFERENCE_LIMIT,
        'Market diff: (W)BTC/USDC, Binance vs CETUS'
    )
)

capybot.addStrategy(
    new RideTheExternalTrend(
        cetusWBTCtoUSDC.uri,
        'BinanceBTCtoUSDC',
        5,
        10,
        [defaultAmount[coins.WBTC], defaultAmount[coins.USDC]],
        RIDE_THE_TREND_LIMIT,
        1.0001,
        'Ride external trend: (W)BTC/USDC, Binance vs CETUS'
    )
)

// Start the bot
capybot.loop(3.6e6, 1000)
