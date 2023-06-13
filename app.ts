import { Ed25519Keypair } from "@mysten/sui.js";
import { Capybot } from "./capybot";
import { coins } from "./coins/coins";
import { CetusPool } from "./dexs/cetus/cetus";
import { logger } from "./logger";
import { Arbitrage } from "./strategies/arbitrage";
import { RideTheTrend } from "./strategies/ride_the_trend";

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

// Setup wallet from passphrase.
// export const keypair = Ed25519Keypair.generate();
const phrase = process.env.ADMIN_PHRASE;
const keypair = Ed25519Keypair.deriveKeypair(phrase!);

let capybot = new Capybot(keypair);

console.log("*** CetusPool", CetusPool);

const USDCtoSUI = new CetusPool(
  "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630",
  coins.USDC,
  coins.SUI,
  true
);

const CETUStoSUI = new CetusPool(
  "0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded",
  coins.CETUS,
  coins.SUI,
  false
);

const USDCtoCETUS = new CetusPool(
  "0x238f7e4648e62751de29c982cbf639b4225547c31db7bd866982d7d56fc2c7a8",
  coins.USDC,
  coins.CETUS,
  false
);

capybot.addPool(USDCtoSUI);
capybot.addPool(CETUStoSUI);
capybot.addPool(USDCtoCETUS);

// Trend riding strategies
capybot.addStrategy(new RideTheTrend(USDCtoSUI.pool, 5, 10, 1.002));
capybot.addStrategy(new RideTheTrend(CETUStoSUI.pool, 5, 10, 1.002));
capybot.addStrategy(new RideTheTrend(USDCtoCETUS.pool, 5, 10, 1.002));

// Add triangular arbitrage strategy: USDC/SUI -> CETUS/SUI -> USDC/CETUS.
capybot.addStrategy(
  new Arbitrage(
    [
      {
        pool: USDCtoSUI.pool,
        a2b: USDCtoSUI.a2b,
      },
      {
        pool: CETUStoSUI.pool,
        a2b: CETUStoSUI.a2b,
      },
      {
        pool: USDCtoCETUS.pool,
        a2b: USDCtoCETUS.a2b,
      },
    ],
    1.002
  )
);

logger.info(capybot.strategies);

// Start the bot
capybot.loop(3.6e6, 1000);
