import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client'
import { Keypair } from '@mysten/sui.js/dist/cjs/cryptography/keypair'
import { TransactionBlock } from '@mysten/sui.js/transactions'

import { setTimeout } from 'timers/promises'
import { DataSource } from './data_sources/data_source'
import { SuiNetworks } from './dexs/types'
import { CetusPool } from './dexs/cetus/cetus'
import { CetusParams, RAMMSuiParams, TurbosParams } from './dexs/dexsParams'
import { Pool } from './dexs/pool'
import { logger } from './logger'
import { Strategy } from './strategies/strategy'
import { RAMMPool } from './dexs/ramm-sui/ramm-sui'

// Default gas budget: 1.5 `SUI`
const DEFAULT_GAS_BUDGET: number = 1.5 * (10 ** 9)

/**
 * A simple trading bot which subscribes to a number of trading pools across different DEXs. The bot may use multiple
 * strategies to trade on these pools.
 */
export class Capybot {
    public dataSources: Record<string, DataSource> = {}
    public pools: Record<
        string,
        Pool<CetusParams | TurbosParams | RAMMSuiParams>
    > = {}
    public strategies: Record<string, Array<Strategy>> = {}
    private keypair: Keypair
    private suiClient: SuiClient
    private network: SuiNetworks;

    constructor(keypair: Keypair, network: SuiNetworks) {
        this.keypair = keypair
        this.network = network
        this.suiClient = new SuiClient({url: getFullnodeUrl(network)})
    }

    async loop(duration: number, delay: number) {
        let startTime = new Date().getTime()

        let uniqueStrategies: Record<string, any> = {}
        for (const pool in this.strategies) {
            for (const strategy of this.strategies[pool]) {
                if (!uniqueStrategies.hasOwnProperty(strategy.uri)) {
                    uniqueStrategies[strategy.uri] = strategy['parameters']
                }
            }
        }
        logger.info({ strategies: uniqueStrategies }, 'strategies')

        let transactionBlock: TransactionBlock = new TransactionBlock()
        while (new Date().getTime() - startTime < duration) {
            for (const uri in this.dataSources) {
                let dataSource = this.dataSources[uri]
                let data = await dataSource.getData()
                logger.info(
                    {
                        price: data,
                    },
                    'price'
                )

                // Push new data to all strategies subscribed to this data source
                for (const strategy of this.strategies[uri]) {
                    // Get orders for this strategy.
                    let tradeOrders = strategy.evaluate(data)

                    // Create transactions for the suggested trades
                    transactionBlock = new TransactionBlock()
                    for (const order of tradeOrders) {
                        logger.info(
                            { strategy: strategy.uri, decision: order },
                            'order'
                        )
                        let amountIn = Math.round(order.amountIn)
                        let amountOut = Math.round(
                            order.estimatedPrice * amountIn
                        )
                        const a2b: boolean = order.a2b
                        const byAmountIn: boolean = true
                        const slippage: number = 1 // TODO: Define this in a meaningful way. Perhaps by the strategies.

                        if (this.pools[order.pool] instanceof CetusPool) {
                            transactionBlock = await this.pools[
                                order.pool
                            ].createSwapTransaction(transactionBlock, {
                                a2b,
                                amountIn,
                                amountOut,
                                byAmountIn,
                                slippage,
                            })
                        } else if (this.pools[order.pool] instanceof RAMMPool) {
                            transactionBlock = await this.pools[
                                order.pool
                            ].createSwapTransaction(transactionBlock, {
                                a2b,
                                amountIn,
                            })
                        }
                    }
                    // Execute the transactions
                    await this.executeTransactionBlock(
                        transactionBlock,
                        strategy
                    )
                }
            }
            await setTimeout(delay)
        }
    }

    private async executeTransactionBlock(
        transactionBlock: TransactionBlock,
        strategy: Strategy
    ) {
        if (transactionBlock.blockData.transactions.length !== 0) {
            try {
                transactionBlock.setGasBudget(DEFAULT_GAS_BUDGET)
                let result = await this.suiClient.signAndExecuteTransactionBlock({
                    transactionBlock,
                    signer: this.keypair,
                    options: {
                        showObjectChanges: true,
                        showEffects: true,
                    },
                })
                logger.info(
                    { strategy: strategy, transaction: result },
                    'transaction'
                )
            } catch (e) {
                logger.error(e)
            }
        }
    }

    /** Add a strategy to this bot. The pools it subscribes to must have been added first. */
    addStrategy(strategy: Strategy) {
        for (const dataSource of strategy.subscribes_to()) {
            if (!this.dataSources.hasOwnProperty(dataSource)) {
                throw new Error(
                    'Bot does not know the dataSource with address ' +
                        dataSource
                )
            }
            this.strategies[dataSource].push(strategy)
        }
    }

    /** Add a new price data source for this bot to use */
    addDataSource(dataSource: DataSource) {
        if (this.dataSources.hasOwnProperty(dataSource.uri)) {
            throw new Error(
                'Data source ' + dataSource.uri + ' has already been added.'
            )
        }
        this.dataSources[dataSource.uri] = dataSource
        this.strategies[dataSource.uri] = []
    }

    /** Add a new pool for this bot to use for trading. */
    addPool(pool: Pool<CetusParams | RAMMSuiParams | TurbosParams>) {
        if (this.pools.hasOwnProperty(pool.uri)) {
            throw new Error('Pool ' + pool.uri + ' has already been added.')
        }
        this.pools[pool.uri] = pool
        this.addDataSource(pool)
    }
}
