import {buildSdkOptions} from "./config";
import SDK, {
    adjustForSlippage,
    d,
    Percentage,
    Pool,
    PreSwapParams,
    sendTransaction
} from "@cetusprotocol/cetus-sui-clmm-sdk/dist";
import {setTimeout} from "timers/promises";
import {RideTheTrend, Strategy} from "./strategies";
import {Entry} from "./types";
import { Ed25519Keypair, RawSigner } from '@mysten/sui.js';
const BN = require('bn.js');

// Catus SDK
let sdk = new SDK(buildSdkOptions())

// Setup
const delay = 5000; // 5 seconds

// Setup wallet from passphrase.
const mnemonics = '';
const keypair = Ed25519Keypair.deriveKeypair(mnemonics);
const signer = new RawSigner(keypair, sdk.fullClient);
console.log("Using account: " + keypair.getPublicKey().toSuiAddress());

// Pools to monitor
let pools = [
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
    '0x06d8af9e6afd27262db436f0d37b304a041f710c3ea1fa4c3a9bab36b3569ad3', // USDT / SUI
];

// Strategies to use
const strategies: Strategy[] = [
    new RideTheTrend(5, 10),
];

// Cache of historic data for strategies to use
let history: Record<string, Array<Entry>> = {};
pools.forEach((pool) => {
    history[pool] = [];
});


/** Get amounts of each token from a given pool. */
async function getAmounts(pool: string): Promise<[number, number]> {
    let pool_info = await sdk.Pool.getPool(pool);

    return [
        pool_info.coinAmountA,
        pool_info.coinAmountB]
}

/** Assuming the sender has enough funds, swap a given amount of tokens from the pool. */
async function swap(pool_address: string, amount: number, a2b: boolean): Promise<void> {
    let pool = await sdk.Pool.getPool(pool_address);

    console.log("Swapping " + amount + " " + (a2b ? pool.coinTypeA : pool.coinTypeB) + " for " + (a2b ? pool.coinTypeB : pool.coinTypeA) + " in pool " + pool_address);
    let params = {
        a2b: a2b,
        amount: amount.toString(),
        by_amount_in: true,
        coinTypeA: pool.coinTypeA,
        coinTypeB: pool.coinTypeB,
        current_sqrt_price: pool.current_sqrt_price,
        decimalsA: 8,
        decimalsB: 8,
        pool: pool,
    };

    const res: any = await sdk.Swap.preswap(params);
    const slippage = Percentage.fromDecimal(d(5))
    const toAmount = res.estimatedAmountOut;
    const amountLimit =  adjustForSlippage(new BN(toAmount), slippage, false);

    sdk.senderAddress = keypair.getPublicKey().toSuiAddress();
    const swapPayload = await sdk.Swap.createSwapTransactionPayload(
        {
            pool_id: pool.poolAddress,
            coinTypeA: pool.coinTypeA,
            coinTypeB: pool.coinTypeB,
            a2b: a2b,
            by_amount_in: true,
            amount: res.amount.toString(),
            amount_limit: amountLimit.toString(),
        },
    );
    const transferTxn = await sendTransaction(signer, swapPayload);
    console.log('Sent transaction: ', transferTxn)
}

async function mainLoop(): Promise<void> {

    let running = true;

    while (running) {
        for (const pool of pools) {
            let amounts = await getAmounts(pool);

            // Save to history
            let entry: Entry = {
                pool: pool,
                timestamp: new Date().toISOString(),
                amountA: amounts[0],
                amountB: amounts[1],
            }
            history[pool].push(entry);

            for (const strategy of strategies) {
                if (history[pool].length < strategy.history_required()) {
                    continue;
                }
                let decision = strategy.evaluate(history[pool].slice(history[pool].length - strategy.history_required(), history[pool].length));
                if (decision != 0) {
                    console.log("Decision for pool " + pool + " with strategy " + strategy.name + ": " + decision)

                    // TODO: Compute a reasonable amount to swap here and ensure that the sender has enough funds
                    await swap(pool, 10000, decision < 0);
                }
            }
        }
        await setTimeout(delay);
    }
}

mainLoop().then(r => console.log("Done"));