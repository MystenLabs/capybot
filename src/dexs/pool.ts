import { TransactionBlock } from '@mysten/sui.js'
import { DataPoint, DataType } from '../data_sources/data_point'
import { DataSource } from '../data_sources/data_source'
import { CetusParams, SuiswapParams, TurbosParams } from './dexsParams'

export type PreswapResult = {
    estimatedAmountIn: number
    estimatedAmountOut: number
    estimatedFeeAmount: number
}

/**
 * Abstract class representing a pool of liquidity for decentralized exchanges (DEXs) such as Cetus, Suiswap, and Turbos.
 */
export abstract class Pool<
    C extends CetusParams | SuiswapParams | TurbosParams,
> extends DataSource {
    /**
     * The coin type A for the pool.
     */
    public coinTypeA: string
    /**
     * The coin type B for the pool.
     */
    public coinTypeB: string

    /**
     * Creates an instance of Pool.
     * @param address The address of the pool.
     * @param coinTypeA The coin type A for the pool.
     * @param coinTypeB The coin type B for the pool.
     */
    constructor(address: string, coinTypeA: string, coinTypeB: string) {
        super(address)
        this.coinTypeA = coinTypeA
        this.coinTypeB = coinTypeB
    }

    /**
     * Abstract method for creating a swap transaction.
     * @param transactionBlock The transaction block to create the transaction in.
     * @param params The parameters for the swap transaction.
     * @returns A Promise of type TransactionBlock.
     */
    abstract createSwapTransaction(
        transactionBlock: TransactionBlock,
        params: C
    ): Promise<TransactionBlock>

    /**
     * Abstract method for estimating the price of a cryptocurrency swap and the fee.
     * @returns A Promise of type number representing the estimated price of the swap and the relative fee.
     */
    abstract estimatePriceAndFee(): Promise<{
        price: number
        fee: number
    }>

    /**
     * Method for getting data about the pool.
     * @returns A Promise of type DataPoint representing data about the pool.
     */
    async getData(): Promise<DataPoint> {
        let priceAndFee = await this.estimatePriceAndFee()
        return {
            type: DataType.Price,
            source_uri: this.uri,
            coinTypeFrom: this.coinTypeA,
            coinTypeTo: this.coinTypeB,
            price: priceAndFee.price,
            fee: priceAndFee.fee,
        }
    }
}
