import { DataPoint, DataType } from '../data_sources/data_point'
import { Strategy } from './strategy'
import { TradeOrder } from './order'

type PoolWithDirection = {
    pool: string
    a2b: boolean
}

export class Arbitrage extends Strategy {
    private readonly lowerLimit: number
    private readonly poolChain: Array<PoolWithDirection>
    private readonly poolChainAsString: string
    private latestRate: Record<string, number> = {}
    private latestFee: Record<string, number> = {}
    private readonly defaultAmount: number

    /**
     * Create a new arbitrage strategy.
     *
     * @param poolChain The chain of pools to consider for an arbitrage. The order should be defined such that a transaction on all chains in order will end up with the same token.
     * @param defaultAmount The default amount of the first coin in the pool chain to trade (e.g. `poolChain[0].a2b ? poolChain[0].pool.coinTypeA : poolChain[0].pool.coinTypeB`.
     * @param relativeLimit Relative limit is percentage, e.g. 1.05 for a 5% win.
     * @param name A human-readable name for this strategy.
     */
    constructor(
        poolChain: Array<PoolWithDirection>,
        defaultAmount: number,
        relativeLimit: number,
        name: string
    ) {
        super({
            name: name,
            poolChain: poolChain,
        })
        this.poolChain = poolChain
        this.defaultAmount = defaultAmount
        this.lowerLimit = relativeLimit
        // A short string representation of the pools used. Used for logging and debugging
        this.poolChainAsString = this.poolChain
            .map((p) => p.pool.substring(0, 8))
            .toString()
    }

    evaluate(data: DataPoint): Array<TradeOrder> {
        // This strategy is only interested in the price from the pools it's observing
        if (
            data.type != DataType.Price ||
            !this.poolChain.map((p) => p.pool).includes(data.source_uri)
        ) {
            return []
        }

        // Update history
        this.latestRate[data.source_uri] = data.price
        this.latestFee[data.source_uri] = data.fee

        // Compute the price when exchanging coins around the chain
        let arbitrage = 1
        let arbitrageReverse = 1
        for (const pool of this.poolChain) {
            let rate = this.getLatestRate(pool.pool, pool.a2b)
            if (rate == undefined) {
                // Not all pools have a registered value yet.
                return []
            }
            arbitrage *= (1 - this.latestFee[pool.pool]) * rate
            arbitrageReverse *= (1 - this.latestFee[pool.pool]) * (1 / rate)
        }
        this.logStatus({ arbitrage: arbitrage, reverse: arbitrageReverse })

        if (arbitrage > this.lowerLimit) {
            // The amount of A by trading around the chain is higher than the amount in.
            let orders = []
            let amountIn: number = this.defaultAmount
            for (const pool of this.poolChain) {
                let latestRate = this.getLatestRate(pool.pool, pool.a2b)
                orders.push({
                    pool: pool.pool,
                    amountIn: amountIn,
                    estimatedPrice: latestRate,
                    a2b: pool.a2b,
                })
                amountIn = amountIn * latestRate
            }
            return orders
        } else if (arbitrageReverse > this.lowerLimit) {
            // The amount of A by trading around the chain is lower than the amount in. Trade in the opposite direction.
            let orders = []
            let amount: number = this.defaultAmount
            for (const pool of this.poolChain.reverse()) {
                let latestRate = this.getLatestRate(pool.pool, !pool.a2b)
                orders.push({
                    pool: pool.pool,
                    amountIn: amount,
                    estimatedPrice: latestRate,
                    a2b: !pool.a2b,
                })
                amount = amount * latestRate
            }
            return orders
        }

        // No decisions can be made at this point
        return []
    }

    subscribes_to(): Array<string> {
        return this.poolChain.map((value) => value.pool)
    }

    getLatestRate(pool: string, a2b: boolean): number {
        return a2b ? this.latestRate[pool] : 1 / this.latestRate[pool]
    }
}
