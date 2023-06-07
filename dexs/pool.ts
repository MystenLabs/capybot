import {TransactionBlock} from "@mysten/sui.js";
import {defaultAmount} from "../coins/coins";

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

    async estimatePrice(): Promise<number> {
        let res = await this.preswap(true, defaultAmount[this.coinTypeA], true);
        return res.estimatedAmountOut / res.estimatedAmountIn;
    }

}