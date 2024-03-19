/**
 * Type representing parameters for the Cetus decentralized exchange.
 */
export type CetusParams = {
    /**
     * A boolean value indicating whether to swap from A to B or from B to A.
     */
    a2b: boolean
    /**
     * The amount of cryptocurrency to swap.
     */
    amountIn: number
    /**
     * The amount of cryptocurrency to receive in exchange.
     */
    amountOut: number
    /**
     * A boolean value indicating whether the amount is specified as input or output.
     */
    byAmountIn: boolean
    /**
     * The maximum allowable slippage for the swap transaction.
     */
    slippage: number
}

export type RAMMSuiParams = {
    /**
     * The Sui Move type of the trade's inbound asset.
     */
    assetIn: string,
    /**
     * The Sui Move type of the trade's outbound asset.
     */
    assetOut: string,
    /**
     * The amount of the inbound asset to trade.
     */
    amountIn: number,
    //minAmountOut: number,
}

/**
 * Type representing parameters for the Turbos decentralized exchange.
 */
export type TurbosParams = {
    /**
     * A boolean value indicating whether to swap from A to B or from B to A.
     */
    a2b: boolean
    /**
     * The amount of cryptocurrency to swap.
     */
    amountIn: number
    /**
     * A boolean value indicating whether the amount is specified as input or output.
     */
    amountSpecifiedIsInput: boolean
    /**
     * The maximum allowable slippage for the swap transaction.
     */
    slippage: number
}
