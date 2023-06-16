import {
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
  Percentage,
  SDK,
  adjustForSlippage,
  d,
} from "@cetusprotocol/cetus-sui-clmm-sdk/dist";
import {
  Connection,
  JsonRpcProvider,
  SUI_CLOCK_OBJECT_ID,
  TransactionArgument,
  TransactionBlock,
} from "@mysten/sui.js";
import BN from "bn.js";
import { getCoinInfo } from "../../coins/coins";
import { keypair } from "../../index";
import { buildInputCoinForAmount } from "../../utils/utils";
import { Pool, PreswapResult } from "../pool";
import { mainnet } from "./mainnet_config";
import { testnet } from "./testnet_config";

enum sdkEnv {
  mainnet = "mainnet",
  testnet = "testnet",
}

// Use testnet or mainnet.
const currSdkEnv: sdkEnv = sdkEnv.mainnet;

function buildSdkOptions() {
  switch (currSdkEnv) {
    case sdkEnv.mainnet:
      return mainnet;
    case sdkEnv.testnet:
      return testnet;
  }
}

export class CetusPool extends Pool {
  private sdk: SDK;
  private package: string;
  private module: string;
  private globalConfig: string;

  constructor(address: string, coinTypeA: string, coinTypeB: string) {
    super(address, coinTypeA, coinTypeB);
    this.sdk = new SDK(buildSdkOptions());
    this.sdk.senderAddress = keypair.getPublicKey().toSuiAddress();

    this.package = mainnet.package;
    this.module = mainnet.module;
    this.globalConfig = mainnet.globalConfig;
  }

  async createSwapTransaction(
    a2b: boolean,
    amountIn: number,
    amountOut: number,
    byAmountIn: boolean,
    slippage: number
  ): Promise<TransactionBlock | undefined> {
    const amountLimit = adjustForSlippage(
      new BN(amountOut),
      Percentage.fromDecimal(d(slippage)),
      false
    );
    // return this.sdk.Swap.createSwapTransactionPayload({
    //   pool_id: this.uri,
    //   coinTypeA: this.coinTypeA,
    //   coinTypeB: this.coinTypeB,
    //   a2b: a2b,
    //   by_amount_in: byAmountIn,
    //   amount: byAmountIn ? amountIn.toString() : amountOut.toString(),
    //   amount_limit: amountLimit.toString(),
    // });

     const txb = await this.createTransactionBlock(
      a2b,
      amountIn,
      amountOut,
      byAmountIn,
      slippage
     );
    return txb;
  }

  async createTransactionBlock(
    a2b: boolean,
    amountIn: number,
    amountOut: number,
    byAmountIn: boolean,
    slippage: number
  ): Promise<TransactionBlock | undefined> {
    console.log(
      `Swap: (${amountIn}) [${a2b ? this.coinTypeA : this.coinTypeB}], 
       To: [${!a2b ? this.coinTypeA : this.coinTypeB}], 
       pool: ${this.uri}`
    );
    const admin = process.env.ADMIN_ADDRESS;

    let provider = new JsonRpcProvider(
      new Connection({
        fullnode: mainnet.fullRpcUrl,
      })
    );

    const amountLimit = adjustForSlippage(
      new BN(amountOut),
      Percentage.fromDecimal(d(slippage)),
      false
    );

    const functionName = a2b ? "swap_a2b" : "swap_b2a";
    const sqrtPriceLimit = getDefaultSqrtPriceLimit(a2b);

    const transactionBlock = new TransactionBlock();

    const coins: TransactionArgument[] | undefined =
      await buildInputCoinForAmount(
        transactionBlock,
        BigInt(amountIn),
        a2b ? this.coinTypeA : this.coinTypeB,
        admin!,
        provider
      );

    if (typeof coins !== "undefined") {
      transactionBlock.moveCall({
        target: `${this.package}::${this.module}::${functionName}`,
        arguments: [
          transactionBlock.object(this.globalConfig),
          transactionBlock.object(this.uri),
          transactionBlock.makeMoveVec({
            objects: coins,
          }),
          transactionBlock.pure(byAmountIn),
          transactionBlock.pure(amountIn),
          transactionBlock.pure(amountLimit),
          transactionBlock.pure(sqrtPriceLimit.toString()),
          transactionBlock.object(SUI_CLOCK_OBJECT_ID),
        ],
        typeArguments: [this.coinTypeA, this.coinTypeB],
      });

      return transactionBlock;
    }
    return undefined;
  }

  async preswap(
    a2b: boolean,
    amount: number,
    byAmountIn: boolean
  ): Promise<PreswapResult> {
    let pool = await this.sdk.Pool.getPool(this.uri);

    // Load coin info
    let coinA = getCoinInfo(this.coinTypeA);
    let coinB = getCoinInfo(this.coinTypeB);

    const res: any = await this.sdk.Swap.preswap({
      a2b: a2b,
      amount: amount.toString(),
      by_amount_in: byAmountIn,
      coinTypeA: this.coinTypeA,
      coinTypeB: this.coinTypeB,
      current_sqrt_price: pool.current_sqrt_price,
      decimalsA: coinA.decimals,
      decimalsB: coinB.decimals,
      pool: pool,
    });

    return {
      estimatedAmountIn: res.estimatedAmountIn,
      estimatedAmountOut: res.estimatedAmountOut,
      estimatedFeeAmount: res.estimatedFeeAmount,
    };
  }

  async estimatePrice(): Promise<number> {
    let pool = await this.sdk.Pool.getPool(this.uri);
    // current_sqrt_price is stored in Q64 format on Cetus
    return pool.current_sqrt_price ** 2 / 2 ** 128;
  }
}

function getDefaultSqrtPriceLimit(a2b: boolean): BN {
  return new BN(a2b ? MIN_SQRT_PRICE : MAX_SQRT_PRICE);
}
