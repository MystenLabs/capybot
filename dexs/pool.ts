import {TransactionBlock} from "@mysten/sui.js";

export type PreswapResult = {
    estimatedAmountIn: number,
    estimatedAmountOut: number,
    estimatedFeeAmount: number,
}

export abstract class Pool {
    public address: string;
    public coinTypeA: string;
    public coinTypeB: string;

    constructor(address: string, coinTypeA: string, coinTypeB: string) {
        this.address = address;
        this.coinTypeA = coinTypeA;
        this.coinTypeB = coinTypeB;
    }

    abstract preswap(a2b: boolean, amount: number, byAmountIn: boolean): Promise<PreswapResult>;

    abstract createSwapTransaction(a2b: boolean, amountIn: number, amountOut: number, byAmountIn: boolean, slippage: number): Promise<TransactionBlock>;

    // TODO: Do we need the tick index here as well?
    abstract estimatePrice(): Promise<number>;

}