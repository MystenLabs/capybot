import {DataEntry} from "./data_entry";

/** A DataSource provides real-time price data for a pair of coins. This could be a trading pool or an exchange. */
export abstract class DataSource {
    public readonly uri: string;

    protected constructor(uri: string) {
        this.uri = uri;
    }

    /** Get the latest price information from this data source */
    abstract getData(): Promise<DataEntry>;
}