import {buildSdkOptions} from "./config";
import SDK from "@cetusprotocol/cetus-sui-clmm-sdk/dist";
import {setTimeout} from "timers/promises";
import {RideTheTrend, Strategy} from "./strategies";
import {Entry} from "./types";

// Catus SDK
let sdk = new SDK(buildSdkOptions())

const delay = 5000; // 0.1 seconds

// Filesystem to append history
const fs = require('fs');

// Pools to monitor
let pools = [
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

// Cache of historic data
let history: Record<string, Array<Entry>> = {};
pools.forEach((pool) => {
    history[pool] = [];
});

/**
 * Get amounts of each token from a given pool.
 *
 * @param pool
 */
async function getAmounts(pool: string): Promise<[number, number]> {
    let pool_info = await sdk.Pool.getPool(pool);
    return [
        pool_info.coinAmountA,
        pool_info.coinAmountB]
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
            //fs.appendFileSync('history.log', JSON.stringify(entry) + "\n");
            //console.log(JSON.stringify(entry));

            for (const strategy of strategies) {
                if (history[pool].length < strategy.history_required()) {
                    continue;
                }
                let decision = strategy.evaluate(history[pool].slice(history[pool].length - strategy.history_required(), history[pool].length));
                if (decision != 0) {
                    console.log("Decision for pool " + pool + " with strategy " + strategy.name + ": " + decision)
                    // TODO: Execute trade
                }
            }

        }
        await setTimeout(delay);
    }

}


mainLoop();