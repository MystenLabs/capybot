import {setTimeout} from "timers/promises";
import {getPoolInfo, swap} from "./pools";
import {default_amount, delay, pools, runningTime, strategies} from "./config";

async function mainLoop(): Promise<void> {

    let startTime = new Date().getTime();

    while (new Date().getTime() - startTime < runningTime) {
        for (const pool of pools) {
            let pool_info = await getPoolInfo(pool);

            // Push new data to all strategies subscribed to this pool
            for (const strategy of strategies[pool]) {

                // Compute a trading decision for this strategy.
                let decision = strategy.evaluate(pool, {
                    amountA: pool_info.coinAmountA,
                    amountB: pool_info.coinAmountB,
                    timestamp: new Date().getTime(),
                });
                if (decision != null) {
                    console.log("Decision for pool " + pool + " with strategy " + strategy.name + ": Buy " + (decision.amount * 100) + "% coin " + (decision.a2b ? "B" : "A"));
                    swap(decision.pool, decision.a2b, decision.amount * default_amount[decision.a2b ? pool_info.coinTypeA : pool_info.coinTypeB]).then((result) => {
                        console.log("Swap succeeded: " + result);
                    }).catch((e) => {
                        console.log(e);
                    });
                    break;
                }
            }
        }
        await setTimeout(delay);
    }
}

console.log("Using pools:");
pools.forEach((pool) => {
    getPoolInfo(pool).then((pool_info) => {
        console.log(pool_info);
    })
});

mainLoop();