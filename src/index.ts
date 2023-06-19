import { Ed25519Keypair } from "@mysten/sui.js";
import { Capybot } from "./capybot";
import { CetusPool } from "./dexs/cetus/cetus";
import { Arbitrage } from "./strategies/arbitrage";
import { RideTheTrend } from "./strategies/ride_the_trend";

// Convenience map from name to address for commonly used coins
export const coins = {
  SUI: "0x2::sui::SUI",
  USDC: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
  CETUS: "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
  CETUS0: "0x6864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
  BRT: "0x5580c843b6290acb2dbc7d5bf8ab995d4d4b6ba107e2a283b4d481aab1564d68::brt::BRT",
  WETH: "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN",
  TOCE: "0xd2013e206f7983f06132d5b61f7c577638ff63171221f4f600a98863febdfb47::toce::TOCE",
  USDT: "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
};

// Setup default amount to trade for each token in each pool. Set to approximately 10 USD each.
export const defaultAmount: Record<string, number> = {};
defaultAmount[coins.SUI] = 10_000_000_000;
defaultAmount[coins.USDC] = 10_000_000;
defaultAmount[coins.CETUS] = 150_000_000_000;
defaultAmount[coins.CETUS0] = 150_000_000_000;
defaultAmount[coins.BRT] = 1500_000_000_000_000;
defaultAmount[coins.WETH] = 1000_000;
defaultAmount[coins.TOCE] = 1_000_000_000_000;
defaultAmount[coins.USDT] = 10_000_000;

// Setup wallet from passphrase.
const phrase = process.env.ADMIN_PHRASE;
export const keypair = Ed25519Keypair.deriveKeypair(phrase!);

let capybot = new Capybot(keypair);
const cetusUSDCtoSUI = new CetusPool(
  "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630",
  coins.USDC,
  coins.SUI
);
const cetusCETUStoSUI = new CetusPool(
  "0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded",
  coins.CETUS,
  coins.SUI
);
const cetusUSDCtoCETUS = new CetusPool(
  "0x238f7e4648e62751de29c982cbf639b4225547c31db7bd866982d7d56fc2c7a8",
  coins.USDC,
  coins.CETUS
);

capybot.addPool(cetusUSDCtoSUI);
capybot.addPool(cetusCETUStoSUI);
capybot.addPool(cetusUSDCtoCETUS);

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
    1.00001
  )
);
capybot.addStrategy(
  new RideTheTrend(
    cetusCETUStoSUI.uri,
    5,
    10,
    [
      defaultAmount[cetusCETUStoSUI.coinTypeA],
      defaultAmount[cetusCETUStoSUI.coinTypeB],
    ],
    1.00001
  )
);
capybot.addStrategy(
  new RideTheTrend(
    cetusUSDCtoCETUS.uri,
    5,
    10,
    [
      defaultAmount[cetusUSDCtoCETUS.coinTypeA],
      defaultAmount[cetusUSDCtoCETUS.coinTypeB],
    ],
    1.00001
  )
);

// Add triangular arbitrage strategy: USDC/SUI -> (CETUS/SUI)^-1 -> (USDC/CETUS)^-1.
capybot.addStrategy(
  new Arbitrage(
    [
      {
        pool: cetusUSDCtoSUI.uri,
        a2b: true,
      },
      {
        pool: cetusCETUStoSUI.uri,
        a2b: false,
      },
      {
        pool: cetusUSDCtoCETUS.uri,
        a2b: false,
      },
    ],
    defaultAmount[coins.USDC],
    1.002
  )
);

// TODO: Add exchanges as data sources and use MarketDifference strategy once PR #5 lands

// Start the bot
capybot.loop(3.6e6, 1000);
