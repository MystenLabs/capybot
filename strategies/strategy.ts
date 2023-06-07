import {DataEntry} from "./data_entry";
import {TradeSuggestion} from "./trade_suggestion";

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
    abstract evaluate(data: DataEntry): Array<TradeSuggestion>;

    /**
     * The amount of data points required for this strategy to make a decision.
     */
    abstract subscribes_to(): Array<string>;
}

