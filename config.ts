import {mainnet} from './mainnet_config'
import {testnet} from './testnet_config'
import {Ed25519Keypair, RawSigner} from "@mysten/sui.js";
import SDK from "@cetusprotocol/cetus-sui-clmm-sdk/dist";
import {RideTheTrend, Strategy} from "./strategies";

export enum sdkEnv {
    mainnet = "mainnet",
    testnet = "testnet",
}

// Use testnet or mainnet.
export const currSdkEnv: sdkEnv = sdkEnv.mainnet;

export function buildSdkOptions() {
    switch (currSdkEnv) {
        case sdkEnv.mainnet:
            return mainnet;
        case sdkEnv.testnet:
            return testnet;
    }
}

export let sdk = new SDK(buildSdkOptions())

export let pools = [
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
    '0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630', // USDC / SUI
    '0xcde6ea498177a6605f85cfee9a50b3f5433eb773beaa310d083c6e6950b18fe5', // BRT / SUI
    '0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded', // CETUS / SUI
    '0xf7050dbf36ea21993c16c7b901d054baa1a4ca6fe27f20f615116332c12e8098', // TOCE / SUI
    '0x5b0b24c27ccf6d0e98f3a8704d2e577de83fa574d3a9060eb8945eeb82b3e2df', // WETH / SUI
    '0x06d8af9e6afd27262db436f0d37b304a041f710c3ea1fa4c3a9bab36b3569ad3', // USDT / SUI
    '0x238f7e4648e62751de29c982cbf639b4225547c31db7bd866982d7d56fc2c7a8', // CETUS / USDC
];
// Setup default amount to trade for each token in each pool. Set to approximately 1-2 USD each.
export let default_amount: Record<string, number> = {}

// SUI
default_amount['0x2::sui::SUI'] = 2_000_000_000;
// USDC
default_amount['0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN'] = 2_000_000;
// CETUS
default_amount['0x6864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS'] = 30_000_000_000;
// BRT
default_amount['0x5580c843b6290acb2dbc7d5bf8ab995d4d4b6ba107e2a283b4d481aab1564d68::brt::BRT'] = 300_000_000_000_000;
// WETH
default_amount['0xf7050dbf36ea21993c16c7b901d054baa1a4ca6fe27f20f615116332c12e8098'] = 200_000;
// TOCE
default_amount['0xd2013e206f7983f06132d5b61f7c577638ff63171221f4f600a98863febdfb47::toce::TOCE'] = 200_000_000_000;

// Map of pool to strategies subscribed to that pool
export const strategies: Record<string, Array<Strategy>> = {}
pools.forEach((pool) => {
    strategies[pool] = [];
});

/** Subscribe a strategy to the pools it needs */
function subscribe(strategy: Strategy) {
    strategy.subscribe_to().forEach(pool => {
        strategies[pool].push(strategy);
    });
}

// Add strategies
pools.forEach((pool) => {
    subscribe(new RideTheTrend(pool, 5, 10));
});

// App config
export const delay = 1000; // 1 seconds between each update
export const runningTime: number = 3.6e+6; // 1 hour

// Setup wallet from passphrase.
const mnemonics = 'polar fall caution tortoise monitor tray witness bonus dolphin clinic welcome enter';
export const keypair = Ed25519Keypair.deriveKeypair(mnemonics);
export const signer = new RawSigner(keypair, sdk.fullClient);
sdk.senderAddress = keypair.getPublicKey().toSuiAddress();
