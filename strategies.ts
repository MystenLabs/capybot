import {Entry} from "./types";

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

/**
 * If the change has been consistent over some time, buy the corresponding token.
 */
export class RideTheTrend extends Strategy {

    window: number;
    limit: number;

    constructor(window: number, limit: number) {
        super("RideTheTrend (" + window + ", " + limit + ")");
        this.window = window;
        this.limit = limit;
    }

    evaluate(historicData: Array<Entry>): number {

        if (historicData.length != this.window) {
            return 0;
        }

        let start = historicData[0].amountA / historicData[0].amountB;
        let end = historicData[this.window - 1].amountA / historicData[this.window - 1].amountB;

        // Should we consider absolute or relative change here?
        let change = end - start;

        if (change > this.limit) {
            return 1;
        } else if (change < -this.limit) {
            return -1;
        }
        return 0;
    }

    history_required(): number {
        return this.window;
    }
}