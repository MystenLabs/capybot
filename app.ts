import {setTimeout} from "timers/promises";
import {RideTheTrend, Strategy} from "./strategies";
import {default_amount, getPoolInfo, pools, swap} from "./pools";
import {append, getHistory} from "./history";

// Setup
const delay = 1000; // 1 seconds between each update

// Strategies to use
const strategies: Strategy[] = [
    new RideTheTrend(5, 10),
];

const runningTime: number = 3.6e+6; // 1 hour

async function mainLoop(): Promise<void> {

    let startTime = new Date().getTime();

    while (new Date().getTime() - startTime < runningTime) {
        for (const pool of pools) {
            let pool_info = await getPoolInfo(pool);

            // Save to history
            append(pool, [pool_info.coinAmountA, pool_info.coinAmountB]);

            for (const strategy of strategies) {
                // If not enough history has been recorded, skip this strategy
                let history = getHistory(pool, strategy.history_required());
                if (history.length < strategy.history_required()) {
                    continue;
                }

                // Compute a trading decision for this strategy.
                let decision = strategy.evaluate(history);
                if (decision != null) {
                    console.log("Decision for pool " + pool + " with strategy " + strategy.name + ": Buy " + decision.amount + " coin " + (decision.a2b ? "B" : "A"));
                    swap(pool, decision.a2b, decision.amount * default_amount[decision.a2b ? pool_info.coinTypeA : pool_info.coinTypeB]).then((result) => {
                        console.log("Swap succeeded: " + result);
                    }).catch((e) => {
                        console.log(e.toString().split("\n")[0].trim()); // Only print the first line of the error
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