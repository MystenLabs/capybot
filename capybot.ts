import {Keypair} from "@mysten/sui.js";
import {Strategy} from "./strategies/strategy";
import {Pool} from "./dexs/pool";
import {logger} from "./logger";
import {setTimeout} from "timers/promises";
import {defaultAmount} from "./index";
import {DataSource} from "./dexs/data_source";

/**
 * A simple trading bot which subscribes to a number of trading pools across different DEXs. The bot may use multiple
 * strategies to trade on these pools.
 */
export class Capybot {
    public dataSources: Record<string, DataSource> = {};
    public pools: Record<string, Pool> = {};
    public strategies: Record<string, Array<Strategy>> = {}
    private keypair: Keypair;

    constructor(keypair: Keypair) {
        this.keypair = keypair;
    }

    async loop(duration: number, delay: number) {
        let startTime = new Date().getTime();

        while (new Date().getTime() - startTime < duration) {

            for (const uri in this.dataSources) {
                let dataSource = this.dataSources[uri];
                let data = await dataSource.getData();
                logger.info({
                    price: data,
                }, 'price')

                // Push new data to all strategies subscribed to this data source
                for (const strategy of this.strategies[uri]) {

                    // Get orders for this strategy.
                    let tradeOrders = strategy.evaluate(data);

                    // Execute any suggested trades
                    for (const order of tradeOrders) {
                        logger.info({strategy: strategy.name, decision: order}, 'order');
                        let amountIn = order.amount * defaultAmount[order.a2b ?
                            this.pools[order.pool].coinTypeB :
                            this.pools[order.pool].coinTypeA];
                        let expectedAmountOut = order.estimatedPrice * amountIn;
                        // TODO: Do these as a programmable transaction
                        this.pools[order.pool].createSwapTransaction(
                            order.a2b,
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
        for (const dataSource of strategy.subscribes_to()) {
            if (!this.dataSources.hasOwnProperty(dataSource)) {
                throw new Error('Bot does not know the dataSource with address ' + dataSource);
            }
            this.strategies[dataSource].push(strategy);
        }
    }

    /** Add a new price data source for this bot to use */
    addDataSource(dataSource: DataSource) {
        if (this.dataSources.hasOwnProperty(dataSource.uri)) {
            throw new Error('Data source ' + dataSource.uri + " has already been added.");
        }
        this.dataSources[dataSource.uri] = dataSource;
        this.strategies[dataSource.uri] = [];
    }

    /** Add a new pool for this bot to use for trading. */
    addPool(pool: Pool) {
        if (this.pools.hasOwnProperty(pool.uri)) {
            throw new Error('Pool ' + pool.uri + " has already been added.");
        }
        this.pools[pool.uri] = pool;
        this.addDataSource(pool);
    }

}