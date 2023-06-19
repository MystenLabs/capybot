import {logger} from "./logger";
import {CetusPool} from "./dexs/cetus/cetus";
import {RideTheTrend} from "./strategies/ride_the_trend";
import {Arbitrage} from "./strategies/arbitrage";
import {Ed25519Keypair} from "@mysten/sui.js";
import {Capybot} from "./capybot";

// Testnet
// '0x1cc6bf13edcd2e304475478d5a36ed2436eb94bb9c0498f61412cb2446a2b3de',
// '0xc10e379b4658d455ee4b8656213c71561b1d0cd6c20a1403780d144d90262512',
// '0xd40feebfcf7935d40c9e82c9cb437442fee6b70a4be84d94764d0d89bb28ab07',
// '0x5b216b76c267098a7c19cda3956e5cbf15a5c9d225023948cb08f46197adfb05',
// '0x83c101a55563b037f4cd25e5b326b26ae6537dc8048004c1408079f7578dd160',
// '0x6fd4915e6d8d3e2ba6d81787046eb948ae36fdfc75dad2e24f0d4aaa2417a416',
// '0x74dcb8625ddd023e2ef7faf1ae299e3bc4cb4c337d991a5326751034676acdae',
// '0x40c2dd0a9395b1f15a477f0e368c55651b837fd27765395a9412ab07fc75971c',
// '0x9978dc5bcd446a45f1ec6774e3b0706fa23b730df2a289ee320d3ab0dc0580d6'

// Mainnet
// USDC / SUI

// '0xcde6ea498177a6605f85cfee9a50b3f5433eb773beaa310d083c6e6950b18fe5', // BRT / SUI
// '0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded', // CETUS / SUI
// '0xf7050dbf36ea21993c16c7b901d054baa1a4ca6fe27f20f615116332c12e8098', // TOCE / SUI
// '0x5b0b24c27ccf6d0e98f3a8704d2e577de83fa574d3a9060eb8945eeb82b3e2df', // WETH / SUI
// '0x06d8af9e6afd27262db436f0d37b304a041f710c3ea1fa4c3a9bab36b3569ad3', // USDT / SUI
// '0x238f7e4648e62751de29c982cbf639b4225547c31db7bd866982d7d56fc2c7a8', // CETUS / USDC

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

// Setup wallet from passphrase.
export const keypair = Ed25519Keypair.generate();

let capybot = new Capybot(keypair);
capybot.addPool(new CetusPool('0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630', coins.USDC, coins.SUI));
capybot.addPool(new CetusPool('0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded', coins.CETUS, coins.SUI));
capybot.addPool(new CetusPool('0x238f7e4648e62751de29c982cbf639b4225547c31db7bd866982d7d56fc2c7a8', coins.USDC, coins.CETUS));

// Trend riding strategies
capybot.addStrategy(new RideTheTrend('0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630', 5, 10, [defaultAmount[coins.USDC], defaultAmount[coins.SUI]], 1.00001));
capybot.addStrategy(new RideTheTrend('0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded', 5, 10, [defaultAmount[coins.CETUS], defaultAmount[coins.SUI]], 1.00001));
capybot.addStrategy(new RideTheTrend('0x238f7e4648e62751de29c982cbf639b4225547c31db7bd866982d7d56fc2c7a8', 5, 10, [defaultAmount[coins.USDC], defaultAmount[coins.CETUS]], 1.00001));

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
    1.002));

// TODO: Add exchanges as data sources and use MarketDifference strategy once PR #5 lands

// Start the bot
capybot.loop(3.6e+6, 1000);