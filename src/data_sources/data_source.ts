import { DataPoint } from './data_point'

/** A DataSource provides real-time price data for a pair of coins. This could be a trading pool or an exchange. */
export abstract class DataSource {
    public readonly uri: string

    protected constructor(uri: string) {
        this.uri = uri
    }

    /** Get the latest price information from this data source. The price indicates the number of coinTypeB's you can get for 1 coinTypeA. */
    abstract getData(): Promise<DataPoint>
}
