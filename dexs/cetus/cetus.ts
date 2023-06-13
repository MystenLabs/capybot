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
  TransactionBlock,
} from "@mysten/sui.js";
import BN from "bn.js";
import { getCoinInfo } from "../../coins/coins";
import { buildInputCoinForAmount } from "../../utils/utils";
import { CetusParams } from "../dexsParams";
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

export class CetusPool extends Pool<CetusParams> {
  private sdk: SDK;
  private package: string;
  private module: string;
  private globalConfig: string;

  constructor(
    address: string,
    coinTypeA: string,
    coinTypeB: string,
    a2b: boolean
  ) {
    super(address, coinTypeA, coinTypeB, a2b);
    this.sdk = new SDK(buildSdkOptions());

    this.sdk.senderAddress = this.keypair.getPublicKey().toSuiAddress();
    this.package = mainnet.package;
    this.module = mainnet.module;
    this.globalConfig = mainnet.globalConfig;
  }

  async createSwapTransaction(params: CetusParams): Promise<TransactionBlock> {
    const admin = process.env.ADMIN_ADDRESS;

    let provider = new JsonRpcProvider(
      new Connection({
        fullnode: mainnet.fullRpcUrl,
      })
    );

    const amountLimit = adjustForSlippage(
      new BN(params.amountOut),
      Percentage.fromDecimal(d(params.slippage)),
      false
    );

    const functionName = this.a2b ? "swap_a2b" : "swap_b2a";
    const sqrtPriceLimit = getDefaultSqrtPriceLimit(this.a2b);

    const coins = await buildInputCoinForAmount(
      params.transactionBlock,
      BigInt(params.amountIn),
      this.a2b ? this.coinTypeA : this.coinTypeB,
      admin!,
      provider
    );

    params.transactionBlock.moveCall({
      target: `${this.package}::${this.module}::${functionName}`,
      arguments: [
        params.transactionBlock.object(this.globalConfig),
        params.transactionBlock.object(this.pool),
        params.transactionBlock.makeMoveVec({
          objects: coins,
        }),
        params.transactionBlock.pure(params.byAmountIn),
        params.transactionBlock.pure(params.amountIn),
        params.transactionBlock.pure(amountLimit),
        params.transactionBlock.pure(sqrtPriceLimit.toString()),
        params.transactionBlock.object(SUI_CLOCK_OBJECT_ID),
      ],
      typeArguments: [this.coinTypeA, this.coinTypeB],
    });

    return params.transactionBlock;
  }

  async preswap(
    a2b: boolean,
    amount: number,
    byAmountIn: boolean
  ): Promise<PreswapResult> {
    let pool = await this.sdk.Pool.getPool(this.pool);

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
    let pool = await this.sdk.Pool.getPool(this.pool);
    // current_sqrt_price is stored in Q64 format on Cetus
    return pool.current_sqrt_price ** 2 / 2 ** 128;
  }
}

function getDefaultSqrtPriceLimit(a2b: boolean): BN {
  return new BN(a2b ? MIN_SQRT_PRICE : MAX_SQRT_PRICE);
}
