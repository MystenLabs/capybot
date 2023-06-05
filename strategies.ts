import {average} from "simple-statistics";
import {Entry} from "./entry";

export abstract class Strategy {
    name: string;

    protected constructor(name: string) {
        this.name = name;
    }

    /**
     * Outcome of evaluation. Amount should be in the range [-1, 1] and should be scaled to the right amount of tokens
     * by the caller. The a2b parameter indicates whether we should swap coin A for coin B or vice verse. A return value
     * equal to null means that no trade should done.
     *
     * @param pool
     * @param data
     */
    abstract evaluate(pool: string, data: Entry): { pool: string, amount: number, a2b: boolean } | null;

    /**
     * The amount of data points required for this strategy to make a decision.
     */
    abstract subscribe_to(): [string];
}

function price(entry: Entry): number {
    return entry.amountA / entry.amountB;
}

/**
 * If the change has been consistent over some time in a single pool, buy the corresponding token.
 */
export class RideTheTrend extends Strategy {

    private readonly short: number;
    private readonly long: number;
    private shortWasHigher: boolean | null;
    private lastDecision: number;
    private readonly pool: string;

    private history: Array<Entry> = [];

    constructor(pool: string, short: number, long: number) {
        super("RideTheTrend (" + short + "/" + long + ")");
        this.short = short;
        this.long = long;
        this.shortWasHigher = null;
        this.lastDecision = 0;
        this.pool = pool;
    }

    evaluate(_pool: string, data: Entry): { pool: string, amount: number, a2b: boolean } | null {

        if (_pool != this.pool) {
            return null;
        }

        // Keep track of last time this strategy called for a trade. If it was very recent, our trade might have influenced the price.
        this.lastDecision++;

        // Add the new data point to the history
        this.history.push(data);
        if (this.history.length < this.long) {
            return null;
        }

        // Only keep the history we need
        if (this.history.length > this.long) {
            this.history.shift();
        }

        // We're certain that the history has length this.long at this point
        // TODO: We can do this by streaming instead of recomputing the average every time
        let short_average = average(this.history.slice(this.history.length - this.short, this.history.length).map((entry) => {
            return price(entry);
        }));
        let long_average = average(this.history.map((entry) => {
            return price(entry);
        }));

        // The first time we run this, we need to set the initial state
        if (this.shortWasHigher == null) {
            this.shortWasHigher = short_average > long_average;
        }

        // The last trade could have influenced the price, so we wait until this effect has passed
        if (short_average != long_average && this.lastDecision > this.short + 1) {

            // Averages differ - make a decision
            this.lastDecision = 0;

            if (short_average > long_average && !this.shortWasHigher) {
                // Trend has gone up - buy A
                this.shortWasHigher = true;
                return {pool: this.pool, amount: 1, a2b: false};
            } else if (short_average < long_average && this.shortWasHigher) {
                // Trend is going down - get rid of A
                this.shortWasHigher = false;
                return {pool: this.pool, amount: 1, a2b: true};
            }
        }

        // No decision can be made at this point
        return null;
    }

    subscribe_to(): [string] {
        return [this.pool];
    }
}
