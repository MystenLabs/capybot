import {Keypair} from "@mysten/sui.js";
import {Strategy} from "./strategies/strategy";
import {Pool} from "./dexs/pool";
import {logger} from "./logger";
import {defaultAmount} from "./coins/coins";
import {setTimeout} from "timers/promises";
import {DataEntry} from "./strategies/data_entry";

/**
 * A simple trading bot which subscribes to a number of trading pools across different DEXs. The bot may use multiple
 * strategies to trade on these pools.
 */
export class Capybot {
    public pools: Record<string, Pool> = {};
    public strategies: Record<string, Array<Strategy>> = {}
    private keypair: Keypair;

    constructor(keypair: Keypair) {
        this.keypair = keypair;
    }

    async loop(duration: number, delay: number) {
        let startTime = new Date().getTime();

        while (new Date().getTime() - startTime < duration) {

            for (const address in this.pools) {

                let pool = this.pools[address];
                let price = await pool.estimatePrice();

                let data: DataEntry = {
                    pool: pool,
                    priceOfB: price,
                    timestamp: new Date().getTime(),
                };
                logger.info({
                    pool: pool.address,
                    price: price,
                    time: new Date().getTime(),
                }, 'price')

                // Push new data to all strategies subscribed to this pool
                for (const strategy of this.strategies[address]) {

                    // Compute a trading decision for this strategy.
                    let tradeSuggestions = strategy.evaluate(data);

                    // Execute any suggested trades
                    for (const tradeSuggestion of tradeSuggestions) {
                        logger.info({strategy: strategy.name, decision: tradeSuggestion}, 'order');
                        let amountIn = tradeSuggestion.amount * defaultAmount[tradeSuggestion.a2b ? pool.coinTypeB : pool.coinTypeA];
                        let expectedAmountOut = tradeSuggestion.estimatedPrice * amountIn;
                        // TODO: Do these as a programmable transaction
                        this.pools[tradeSuggestion.pool].createSwapTransaction(
                            tradeSuggestion.a2b,
                            amountIn,
                            expectedAmountOut,
                            true,
                            5, // Allow for 5% slippage (??)
                        ).then((result) => {
                            // TODO: Execute transaction
                            logger.info({strategy: strategy, transaction: result}, 'transaction');
                        }).catch((e) => {
                            logger.error(e);
                        });
                    }
                }
            }
            await setTimeout(delay);
        }
    }

    /** Add a strategy to this bot. The pools it subscribes to must have been added first. */
    addStrategy(strategy: Strategy) {
        for (const pool of strategy.subscribes_to()) {
            if (!this.pools.hasOwnProperty(pool)) {
                throw new Error('Bot does not know the pool with address ' + pool);
            }
            this.strategies[pool].push(strategy);
        }
    }

    /** Add a new pool for this bot to use for trading. */
    addPool(pool: Pool) {
        if (this.pools.hasOwnProperty(pool.address)) {
            throw new Error('Pool ' + pool.address + " has already been added.");
        }
        this.pools[pool.address] = pool;
        this.strategies[pool.address] = [];
    }

}