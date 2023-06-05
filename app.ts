import {setTimeout} from "timers/promises";
import {RideTheTrend, Strategy} from "./strategies";
import {default_amount, getAmounts, pools, swap} from "./pools";
import {append, getHistory} from "./history";

// Setup
const delay = 1000; // 1 seconds between each update
let transactionCount = 0;

// Strategies to use
const strategies: Strategy[] = [
    new RideTheTrend(5, 10),
];

const runningTime: number = 3.6e+6; // 1 hour

async function mainLoop(): Promise<void> {

    let startTime = new Date().getTime();

    while (new Date().getTime() - startTime < runningTime) {
        for (const pool of pools) {
            let amounts = await getAmounts(pool);

            // Save to history
            append(pool, amounts);

            for (const strategy of strategies) {
                // If not enough history has been recorded, skip
                let history = getHistory(pool, strategy.history_required());
                if (history.length < strategy.history_required()) {
                    continue;
                }

                // decision < 0 means sell A for B, > 0 means sell B for A, 0 means do nothing
                let decision = strategy.evaluate(history);
                if (decision != 0) {
                    console.log("Decision for pool " + pool + " with strategy " + strategy.name + ": " + decision)
                    let a2b = decision < 0;
                    let coinToBuy = a2b ? 0 : 1;
                    await swap(pool, default_amount[pool][coinToBuy], decision < 0);
                    console.log("Transactions: " + transactionCount++);
                }
            }
        }
        await setTimeout(delay);
    }
}

mainLoop();