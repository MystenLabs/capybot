import { DataPoint } from '../data_sources/data_point'
import { TradeOrder } from './order'
import { Md5 } from 'ts-md5'
import { logger } from '../logger'

export abstract class Strategy {
    public readonly uri: string
    private parameters: any

    protected constructor(parameters: any) {
        this.parameters = parameters
        // Generate short unique identifier for this strategy
        this.uri = Md5.hashAsciiStr(JSON.stringify(parameters))
    }

    /**
     * Outcome of evaluation. Amount should be in the range [-1, 1] and should be scaled to the right amount of tokens
     * by the caller. The a2b parameter indicates whether we should swap coin A for coin B or vice verse. A return value
     * equal to null means that no trade should done.
     *
     * @param data The data to evaluate.
     */
    abstract evaluate(data: DataPoint): Array<TradeOrder>

    /**
     * The pools and coin types this pool needs information from.
     */
    abstract subscribes_to(): Array<string>

    /**
     * Report key statistics to the logger.
     * @param status A map of key-value pairs to report.
     * @protected
     */
    protected logStatus(status: Record<string, number>): void {
        logger.info(
            {
                uri: this.uri,
                data: status,
            },
            'strategy status'
        )
    }
}
