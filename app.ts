import {setTimeout} from "timers/promises";
import {getPoolInfo, swap} from "./pools";
import {default_amount, delay, keypair, pools, runningTime, strategies} from "./config";
import {logger} from "./logger";

async function mainLoop(): Promise<void> {

    let startTime = new Date().getTime();

    while (new Date().getTime() - startTime < runningTime) {
        for (const pool of pools) {
            // Get the latest data from pool
            let pool_info = await getPoolInfo(pool);
            let data = {
                amountA: pool_info.coinAmountA,
                amountB: pool_info.coinAmountB,
                timestamp: new Date().getTime(),
            };

            // Push new data to all strategies subscribed to this pool
            for (const strategy of strategies[pool]) {

                // Compute a trading decision for this strategy.
                let decision = strategy.evaluate(pool, data);

                if (decision != null) {
                    logger.debug({strategy: strategy, decision: decision});
                    swap(
                        decision.pool,
                        decision.a2b,
                        decision.amount * default_amount[decision.a2b ? pool_info.coinTypeB : pool_info.coinTypeA]
                    ).then((result) => {
                        logger.info({strategy: strategy, transaction: result});
                    }).catch((e) => {
                        logger.error(e);
                    });
                }
            }
        }
        await setTimeout(delay);
    }
}

logger.info({address: keypair.getPublicKey().toSuiAddress()});
logger.info({pools: pools});

mainLoop();