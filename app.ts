import {setTimeout} from "timers/promises";
import {getPoolInfo, swap} from "./pools";
import {default_amount, delay, keypair, pools, runningTime, sdk, strategies} from "./config";
import {logger} from "./logger";
import {getCoinInfo} from "./coins/coins";

async function mainLoop(): Promise<void> {

    let startTime = new Date().getTime();

    while (new Date().getTime() - startTime < runningTime) {

        for (const poolAddress of pools) {
            // Get the latest data from pool
            let pool = await getPoolInfo(poolAddress);

            // Load coin info
            // TODO: Cache these
            let coinA = getCoinInfo(pool.coinTypeA);
            let coinB = getCoinInfo(pool.coinTypeB);

            // Do preswap to estimate price
            const res: any = await sdk.Swap.preswap({
                a2b: true,
                amount: default_amount[pool.coinTypeA].toString(),
                by_amount_in: true,
                coinTypeA: pool.coinTypeA,
                coinTypeB: pool.coinTypeB,
                current_sqrt_price: pool.current_sqrt_price,
                decimalsA: coinA.decimals,
                decimalsB: coinB.decimals,
                pool: pool,
            });

            let data = {
                pool: poolAddress,
                coinA: pool.coinTypeA,
                coinB: pool.coinTypeB,
                priceOfB: res.estimatedAmountOut / res.estimatedAmountIn,
                timestamp: new Date().getTime(),
            };
            logger.info(data);

            // Push new data to all strategies subscribed to this pool
            for (const strategy of strategies[poolAddress]) {

                // Compute a trading decision for this strategy.
                let decisions = strategy.evaluate(data);

                // Execute any suggested trades
                for (const decision of decisions) {
                    logger.info({strategy: strategy.name, decision: decision});
                    swap(
                        decision.pool,
                        decision.a2b,
                        decision.amount * default_amount[decision.a2b ? pool.coinTypeB : pool.coinTypeA],
                        false,
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