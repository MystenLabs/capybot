import { TransactionBlock } from "@mysten/sui.js";
import { cetusParams } from "./cetus/cetusParams";
import { suiswapParams } from "./suiswap/suiswapParams";
import { turbosParams } from "./turbos/turbosParams";

export type PreswapResult = {
  estimatedAmountIn: number;
  estimatedAmountOut: number;
  estimatedFeeAmount: number;
};

export abstract class Pool<
  C extends cetusParams | suiswapParams | turbosParams
> {
  public address: string;
  public coinTypeA: string;
  public coinTypeB: string;
  public a2b: boolean;

  constructor(
    address: string,
    coinTypeA: string,
    coinTypeB: string,
    a2b: boolean
  ) {
    this.address = address;
    this.coinTypeA = coinTypeA;
    this.coinTypeB = coinTypeB;
    this.a2b = a2b;
  }

  abstract preswap(
    a2b: boolean,
    amount: number,
    byAmountIn: boolean
  ): Promise<PreswapResult>;

  abstract createSwapTransaction(params: C): Promise<TransactionBlock>;

  // TODO: Do we need the tick index here as well?
  abstract estimatePrice(): Promise<number>;
}
