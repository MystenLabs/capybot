import { Ed25519Keypair, TransactionBlock } from "@mysten/sui.js";
import { CetusParams, SuiswapParams, TurbosParams } from "./dexsParams";

export type PreswapResult = {
  estimatedAmountIn: number;
  estimatedAmountOut: number;
  estimatedFeeAmount: number;
};

export abstract class Pool<
  C extends CetusParams | SuiswapParams | TurbosParams
> {
  protected _pool: string;
  protected _coinTypeA: string;
  protected _coinTypeB: string;
  protected _a2b: boolean;
  protected _keypair: Ed25519Keypair;

  constructor(
    pool: string,
    coinTypeA: string,
    coinTypeB: string,
    a2b: boolean
  ) {
    this._pool = pool;
    this._coinTypeA = coinTypeA;
    this._coinTypeB = coinTypeB;
    this._a2b = a2b;
    this._keypair = Ed25519Keypair.deriveKeypair(process.env.ADMIN_PHRASE!);
  }

  public get pool(): string {
    return this._pool;
  }

  public get coinTypeA(): string {
    return this._coinTypeA;
  }

  public get coinTypeB(): string {
    return this._coinTypeB;
  }

  public get a2b(): boolean {
    return this._a2b;
  }

  public get keypair(): Ed25519Keypair {
    return this._keypair;
  }

  abstract preswap(
    a2b: boolean,
    amount: number,
    byAmountIn: boolean
  ): Promise<PreswapResult>;

  abstract createSwapTransaction(
    params: C
  ): Promise<TransactionBlock | undefined>;

  // TODO: Do we need the tick index here as well?
  abstract estimatePrice(): Promise<number>;
}
