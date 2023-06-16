import {DataEntry} from "./data_entry";
import {TradeOrder} from "./order";

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
    abstract evaluate(data: DataEntry): Array<TradeOrder>;

    /**
     * The pools and coin types this pool needs information from.
     */
    abstract subscribes_to(): Array<string>;
}

