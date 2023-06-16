import {DataEntry, SourceType} from "./data_entry";
import {average} from "simple-statistics";
import {Strategy} from "./strategy";
import {TradeSuggestion} from "./trade_suggestion";
import {logger} from "../logger";

/**
 * If the change has been consistent over some time in a single pool, buy the corresponding token.
 *
 * More accurately, if the short moving average differs from the long moving average we should either buy or short the given token.
 */
export class RideTheTrend extends Strategy {

    private readonly short: number;
    private readonly long: number;
    private shortWasHigher: boolean | null = null;
    private lastDecision: number = 0;
    private readonly pool: string;

    private history: Array<DataEntry> = [];
    private readonly limit: number;

    /** Relative limit is percentage, eg. 1.05 for a 5% win */
    constructor(pool: string, short: number, long: number, limit: number) {
        super("RideTheTrend (" + pool + ", " + short + "/" + long + ")");
        this.short = short;
        this.long = long;
        this.pool = pool;
        this.limit = limit;
    }

    evaluate(data: DataEntry): Array<TradeSuggestion> {

        // This strategy is only interested in the price from the pool it's observing
        if (data.sourceType != SourceType.Pool || data.address != this.pool) {
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
        let short_average = average(this.history.slice(this.history.length - this.short, this.history.length).map(d => d.priceOfB));
        let long_average = average(this.history.map(d => d.priceOfB));

        logger.info({pool: this.pool, value: short_average, range: this.short}, 'moving average')
        logger.info({pool: this.pool, value: long_average, range: this.long}, 'moving average')

        // The first time we run this, we need to set the initial state
        if (this.shortWasHigher == null) {
            this.shortWasHigher = short_average > long_average;
        }

        // The last trade could have influenced the price, so we wait until this effect has passed
        if (short_average != long_average && this.lastDecision > this.short + 1) {

            // Averages differ - make a decision
            this.lastDecision = 0;

            if (short_average / long_average > this.limit && !this.shortWasHigher) {
                // Trend has gone up - buy A
                this.shortWasHigher = true;
                return [{
                    pool: this.pool,
                    amount: 1,
                    estimatedPrice: short_average,
                    a2b: false
                }];
            } else if (short_average / long_average < 1 / this.limit && this.shortWasHigher) {
                // Trend is going down - get rid of A
                this.shortWasHigher = false;
                return [{
                    pool: this.pool, amount: 1,
                    estimatedPrice: short_average,
                    a2b: true
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