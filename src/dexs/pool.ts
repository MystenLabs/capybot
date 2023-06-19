import { TransactionBlock } from "@mysten/sui.js";
import { DataEntry, SourceType } from "../strategies/data_entry";
import { DataSource } from "./data_source";
import { CetusParams, SuiswapParams, TurbosParams } from "./dexsParams";

export type PreswapResult = {
  estimatedAmountIn: number;
  estimatedAmountOut: number;
  estimatedFeeAmount: number;
};

export abstract class Pool<
  C extends CetusParams | SuiswapParams | TurbosParams
> extends DataSource {
  public coinTypeA: string;
  public coinTypeB: string;

  constructor(address: string, coinTypeA: string, coinTypeB: string) {
    super(address);
    this.coinTypeA = coinTypeA;
    this.coinTypeB = coinTypeB;
  }

  abstract preswap(
    a2b: boolean,
    amount: number,
    byAmountIn: boolean
  ): Promise<PreswapResult>;

  abstract createSwapTransaction(
    params: C
  ): Promise<TransactionBlock | undefined>;

  abstract estimatePrice(): Promise<number>;

  async getData(): Promise<DataEntry> {
    let price = await this.estimatePrice();
    return {
      sourceType: SourceType.Pool,
      source: this.uri,
      coinTypeFrom: this.coinTypeA,
      coinTypeTo: this.coinTypeB,
      price: price,
    };
  }
}
