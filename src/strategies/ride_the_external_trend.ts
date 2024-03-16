import { DataPoint, DataType } from '../data_sources/data_point'
import { average } from 'simple-statistics'
import { Strategy } from './strategy'
import { TradeOrder } from './order'

/**
 * If the price of a token from some data source, say an exchange, looks like it's going into a period where it's price is increasing we
 * should buy the token on a trading pool. The trend is determined by comparing a short moving average to a longer moving average.
 */
export class RideTheExternalTrend extends Strategy {
    private readonly short: number
    private readonly long: number
    private lastDecision: number = 0
    private readonly pool: string
    private latestPoolPrice: number = 0

    private history: Array<number> = []
    private readonly limit: number
    private readonly defaultAmounts: [number, number]
    private readonly exchange: string
    private readonly priceRatio: number

    /**
     *
     * @param pool The swap pool to make trades on.
     * @param data_source The source of pricing data.
     * @param short The length of the short moving average.
     * @param long The length of the long moving average.
     * @param defaultAmounts The number of tokens to swap of coin type A and B resp. when the trend changes.
     * @param limit Minimum ratio in the averages to do a trade.
     * @param priceRatio: Minimum ratio between pool price and exchange price.
     * @param name A human readable name for this strategy.
     */
    constructor(
        pool: string,
        data_source: string,
        short: number,
        long: number,
        defaultAmounts: [number, number],
        limit: number,
        priceRatio: number,
        name: string
    ) {
        super({
            name: name,
            pool: pool,
            exchange: data_source,
            short: short,
            long: long,
        })
        this.short = short
        this.long = long
        this.pool = pool
        this.exchange = data_source
        this.defaultAmounts = defaultAmounts
        this.limit = limit
        this.priceRatio = priceRatio
    }

    evaluate(data: DataPoint): Array<TradeOrder> {
        console.log(data)

        // Unknown data type
        if (data.type != DataType.Price) {
            return []
        }

        // This strategy is only interested in the price from the pool it's observing and the external data source.
        if (data.source_uri == this.pool) {
            this.latestPoolPrice = data.price
            return []
        }

        // Keep track of last time this strategy called for a trade. If it was very recent, our trade might have influenced the price.
        this.lastDecision++

        // Get the current price from the data point
        let price = data.price

        // Add the new data point to the history
        this.history.push(price)
        if (this.history.length < this.long) {
            return []
        }

        // Only keep the history we need
        if (this.history.length > this.long) {
            this.history.shift()
        }

        // We're certain that the history has length this.long at this point
        // TODO: We can do this by streaming instead of recomputing the average every time
        let short_average = average(
            this.history.slice(
                this.history.length - this.short,
                this.history.length
            )
        )
        let long_average = average(this.history)

        this.logStatus({
            pool: this.latestPoolPrice,
            exchange: price,
            short_average: short_average,
            long_average: long_average,
        })

        // The last trade could have influenced the price, so we wait until this effect has passed
        if (this.lastDecision > this.long + 1) {
            if (short_average / long_average < 1 / this.limit) {
                // The value of A is going down. Sell A and hope it goes even lower.

                if (price > this.latestPoolPrice * this.priceRatio) {
                    // The pool price is not as good as the exchange price, so we do not trade anything now
                    return []
                }

                this.lastDecision = 0
                return [
                    {
                        pool: this.pool,
                        amountIn: this.defaultAmounts[0],
                        estimatedPrice: this.latestPoolPrice,
                        a2b: true,
                    },
                ]
            } else if (short_average / long_average > this.limit) {
                // The value of A is going up. Buy and hope it continues.
                this.lastDecision = 0

                if (price < this.latestPoolPrice / this.priceRatio) {
                    // The pool price is not as good as the exchange price, so we do not trade anything now
                    return []
                }

                return [
                    {
                        pool: this.pool,
                        amountIn: this.defaultAmounts[1],
                        estimatedPrice: 1 / this.latestPoolPrice,
                        a2b: false,
                    },
                ]
            }
        }

        // No decision can be made at this point
        return []
    }

    subscribes_to(): Array<string> {
        return [this.pool, this.exchange]
    }
}
