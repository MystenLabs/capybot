import {DataEntry, SourceType} from "./data_entry";
import {average} from "simple-statistics";
import {Strategy} from "./strategy";
import {TradeOrder} from "./order";
import {logger} from "../logger";

/**
 * If the price of a token looks like it's going into a period where it's price is increasing we should buy the token.
 * This is determined by comparing a short moving average to a longer moving average.
 */
export class RideTheTrend extends Strategy {

    private readonly short: number;
    private readonly long: number;
    private shortWasHigher: boolean | null = null;
    private lastDecision: number = 0;
    private readonly pool: string;

    private history: Array<DataEntry> = [];
    private readonly limit: number;
    private readonly defaultAmounts: [number, number];

    /**
     * Create a new trend-riding strategy.
     *
     * @param pool The address of the pool to watch.
     * @param short The length of the short moving average.
     * @param long The length of the long moving average.
     * @param defaultAmounts The number of tokens to swap of coin type A and B resp. when the trend changes.
     * @param limit Relative limit is percentage, eg. 1.05 for a 5% win
     */
    constructor(pool: string, short: number, long: number, defaultAmounts: [number, number], limit: number) {
        super("RideTheTrend (" + pool + ", " + short + "/" + long + ")");
        this.short = short;
        this.long = long;
        this.pool = pool;
        this.defaultAmounts = defaultAmounts;
        this.limit = limit;
    }

    evaluate(data: DataEntry): Array<TradeOrder> {

        // This strategy is only interested in the price from the pool it's observing
        if (data.sourceType != SourceType.Pool || data.uri != this.pool) {
            return [];
        }

        // Keep track of last time this strategy called for a trade. If it was very recent, our trade might have influenced the price.
        this.lastDecision++;

        // Add the new data point to the history
        this.history.push(data);
        if (this.history.length < this.long) {
            return [];
        }

        // Only keep the history we need
        if (this.history.length > this.long) {
            this.history.shift();
        }

        // We're certain that the history has length this.long at this point
        // TODO: We can do this by streaming instead of recomputing the average every time
        let short_average = average(this.history.slice(this.history.length - this.short, this.history.length).map(d => d.price));
        let long_average = average(this.history.map(d => d.price));

        logger.info({pool: this.pool, value: short_average, range: this.short}, 'moving average')
        logger.info({pool: this.pool, value: long_average, range: this.long}, 'moving average')

        // The first time we run this, we need to set the initial state
        if (this.shortWasHigher == null) {
            this.shortWasHigher = short_average > long_average;
        }

        // The last trade could have influenced the price, so we wait until this effect has passed
        if (short_average != long_average && this.lastDecision > this.short + 1) {
            if (short_average / long_average > this.limit && !this.shortWasHigher) {
                // Trend has gone up - buy B for A
                this.lastDecision = 0;
                this.shortWasHigher = true;
                return [{
                    pool: this.pool,
                    amountIn: this.defaultAmounts[0],
                    estimatedPrice: data.price,
                    a2b: true
                }];
            } else if (short_average / long_average < 1 / this.limit && this.shortWasHigher) {
                // Trend is going down - buy A for B
                this.lastDecision = 0;
                this.shortWasHigher = false;
                return [{
                    pool: this.pool,
                    amountIn: this.defaultAmounts[1],
                    estimatedPrice: 1 / data.price,
                    a2b: false
                }];
            }
        }

        // No decision can be made at this point
        return [];
    }

    subscribes_to(): Array<string> {
        return [this.pool];
    }
}