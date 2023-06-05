import {average} from "simple-statistics";
import {Entry} from "./history";

export abstract class Strategy {
    name: string;

    protected constructor(name: string) {
        this.name = name;
    }

    /**
     * Positive means buy A, negative means buy B.
     *
     * @param historicData
     */
    abstract evaluate(historicData: Array<Entry>): number;

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

    evaluate(historicData: Array<Entry>): number {

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
                this.shortWasHigher = true;
                return 1; // Trend has gone up - buy A
            } else if (short_average < long_average && this.shortWasHigher) {
                this.shortWasHigher = false;
                return -1; // Trend is going down - buy B
            }
        }

        return 0;
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

    evaluate(historicData: Array<Entry>): number {
        let rate = price(historicData[0]);

        if (rate < this.limits[historicData[0].pool][0]) {
            return -1;
        } else if (rate > this.limits[historicData[0].pool][1]) {
            return 1;
        }
        return 0;
    }

    history_required(): number {
        return 1;
    }

}