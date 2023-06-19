import {CetusPool} from "./dexs/cetus/cetus";
import {RideTheTrend} from "./strategies/ride_the_trend";
import {Arbitrage} from "./strategies/arbitrage";
import {Ed25519Keypair} from "@mysten/sui.js";
import {Capybot} from "./capybot";

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
defaultAmount[coins.SUI] = 1_000_000_000;
defaultAmount[coins.USDC] = 1_000_000;
defaultAmount[coins.CETUS] = 15_000_000_000;
defaultAmount[coins.CETUS0] = 15_000_000_000;
defaultAmount[coins.BRT] = 150_000_000_000_000;
defaultAmount[coins.WETH] = 100_000;
defaultAmount[coins.TOCE] = 100_000_000_000;
defaultAmount[coins.USDT] = 1_000_000;

// Setup wallet from passphrase.
export const keypair = Ed25519Keypair.generate();

let capybot = new Capybot(keypair);
capybot.addPool(new CetusPool('0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630', coins.USDC, coins.SUI));
capybot.addPool(new CetusPool('0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded', coins.CETUS, coins.SUI));
capybot.addPool(new CetusPool('0x238f7e4648e62751de29c982cbf639b4225547c31db7bd866982d7d56fc2c7a8', coins.USDC, coins.CETUS));

// Trend riding strategies
capybot.addStrategy(new RideTheTrend('0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630', 5, 10, [defaultAmount[coins.USDC], defaultAmount[coins.SUI]], 1.0001));
capybot.addStrategy(new RideTheTrend('0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded', 5, 10, [defaultAmount[coins.CETUS], defaultAmount[coins.SUI]], 1.0001));
capybot.addStrategy(new RideTheTrend('0x238f7e4648e62751de29c982cbf639b4225547c31db7bd866982d7d56fc2c7a8', 5, 10, [defaultAmount[coins.USDC], defaultAmount[coins.CETUS]], 1.0001));

// Add triangular arbitrage strategy: USDC/SUI -> (CETUS/SUI)^-1 -> (USDC/CETUS)^-1.
capybot.addStrategy(new Arbitrage([
        {
            pool: '0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630',
            a2b: true
        },
        {
            pool: '0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded',
            a2b: false
        },
        {
            pool: '0x238f7e4648e62751de29c982cbf639b4225547c31db7bd866982d7d56fc2c7a8',
            a2b: false
        }],
    defaultAmount[coins.USDC],
    1.0001));

// TODO: Add exchanges as data sources and use MarketDifference strategy once PR #5 lands

// Start the bot
capybot.loop(3.6e+6, 1000);
