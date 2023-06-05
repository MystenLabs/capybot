import {average} from "simple-statistics";
import {Entry} from "./history";

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
     * @param historicData
     */
    abstract evaluate(historicData: Array<Entry>): { amount: number, a2b: boolean } | null;

    /**
     * The amount of data points required for this strategy to make a decision.
     */
    abstract history_required(): number;
}

function price(entry: Entry): number {
    return entry.amountA / entry.amountB;
}

/**
 * If the change has been consistent over some time, buy the corresponding token.
 */
export class RideTheTrend extends Strategy {

    short: number;
    long: number;
    private shortWasHigher: boolean | null;
    private lastDecision: number;

    constructor(short: number, long: number) {
        super("RideTheTrend (" + short + "/" + long + ")");
        this.short = short;
        this.long = long;
        this.shortWasHigher = null;
        this.lastDecision = 0;
    }

    evaluate(historicData: Array<Entry>): { amount: number, a2b: boolean } | null {

        // Keep track of last time this strategy called for a trade. If it was very recent, our trade might have influenced the price.
        this.lastDecision++;

        let short_average = average(historicData.slice(historicData.length - this.short, historicData.length).map((entry) => {
            return price(entry);
        }));
        let long_average = average(historicData.slice(historicData.length - this.long, historicData.length).map((entry) => {
            return price(entry);
        }));

        // The first time we run this, we need to set the initial state
        if (this.shortWasHigher == null) {
            this.shortWasHigher = short_average > long_average;
        }

        // The last trade could have influenced the price, so we wait until this effect has passed
        if (short_average != long_average && this.lastDecision > this.short + 1) {
            this.lastDecision = 0;
            if (short_average > long_average && !this.shortWasHigher) {
                // Trend has gone up - buy A
                this.shortWasHigher = true;
                return {amount: 1, a2b: false};
            } else if (short_average < long_average && this.shortWasHigher) {
                // Trend is going down - get rid of A
                this.shortWasHigher = false;
                return {amount: 1, a2b: true};
            }
        }

        // No decision can be made at this point
        return null;
    }

    history_required(): number {
        return this.long;
    }
}

/**
 * If the price exceeds some predefined bounds, sell the corresponding token.
 */
export class StopStrategy extends Strategy {
    private readonly limits: Record<string, [number, number]>;

    constructor(limits: Record<string, [number, number]>) {
        super("StopStrategy");
        this.limits = limits;
    }

    evaluate(historicData: Array<Entry>): { amount: number, a2b: boolean } | null {
        let rate = price(historicData[0]);

        if (rate < this.limits[historicData[0].pool][0]) {
            return {amount: 1, a2b: true};
        } else if (rate > this.limits[historicData[0].pool][1]) {
            return {amount: 1, a2b: false};
        }
        return null;
    }

    history_required(): number {
        return 1;
    }

}