import SDK, {
  Percentage,
  SdkOptions,
  adjustForSlippage,
  d,
} from "@cetusprotocol/cetus-sui-clmm-sdk/dist";
import { Connection, JsonRpcProvider, TransactionBlock } from "@mysten/sui.js";
import BN from "bn.js";
import { getCoinInfo } from "../../coins/coins";
import { getTotalBalanceByCoinType } from "../../utils/utils";
import { cetusConfig } from "../dexsConfig";
import { CetusParams } from "../dexsParams";
import { Pool, PreswapResult } from "../pool";
import { mainnet } from "./mainnet_config";

function buildSdkOptions(): SdkOptions {
  return mainnet;
}

export class CetusPool extends Pool<CetusParams> {
  private sdk: SDK;
  private package: string;
  private module: string;
  private globalConfig: string;
  private provider: JsonRpcProvider;
  private ownerAddress: string;

  constructor(address: string, coinTypeA: string, coinTypeB: string) {
    super(address, coinTypeA, coinTypeB);
    this.sdk = new SDK(buildSdkOptions());
    this.sdk.senderAddress = process.env.ADMIN_ADDRESS!;

    this.package = cetusConfig.contract.PackageId;
    this.module = cetusConfig.contract.ModuleId;
    this.globalConfig = cetusConfig.contract.GlobalConfig;
    this.provider = new JsonRpcProvider(
      new Connection({
        fullnode: mainnet.fullRpcUrl,
      })
    );
    this.ownerAddress = process.env.ADMIN_ADDRESS!;
  }

  async createSwapTransaction(
    params: CetusParams
  ): Promise<TransactionBlock | undefined> {
    const amountLimit = adjustForSlippage(
      new BN(params.amountOut),
      Percentage.fromDecimal(d(params.slippage)),
      false
    );

    const totalBalance = await getTotalBalanceByCoinType(
      this.provider,
      this.ownerAddress,
      params.a2b ? this.coinTypeA : this.coinTypeB
    );

    console.log(
      `TotalBalance for CoinType (${
        params.a2b ? this.coinTypeA : this.coinTypeB
      }), is: ${totalBalance} and amountIn is: ${params.amountIn}`
    );

    if (Number(totalBalance) >= params.amountIn) {
      console.log(
        `******* a2b: ${params.a2b}, amountIn: ${params.amountIn}, amountOut: ${params.amountOut}, byAmountIn: ${params.byAmountIn}, slippage: ${params.slippage}`
      );

      return this.sdk.Swap.createSwapTransactionPayload({
        pool_id: this.uri,
        coinTypeA: this.coinTypeA,
        coinTypeB: this.coinTypeB,
        a2b: params.a2b,
        by_amount_in: params.byAmountIn,
        amount: params.byAmountIn
          ? params.amountIn.toString()
          : params.amountOut.toString(),
        amount_limit: amountLimit.toString(),
      });
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
    // const obj: SuiObjectResponse = await this.provider.getObject({
    //   id: this.uri,
    //   options: { showContent: true, showType: true },
    // });
    // let objFields = null;
    // if (obj && obj.data?.content?.dataType === "moveObject") {
    //   objFields = getObjectFields(obj);
    // }
    // return objFields?.current_sqrt_price ** 2 / 2 ** 128;

    let pool = await this.sdk.Pool.getPool(this.uri);
    return pool.current_sqrt_price ** 2 / 2 ** 128;
  }
}

// function getDefaultSqrtPriceLimit(a2b: boolean): BN {
//   return new BN(a2b ? MIN_SQRT_PRICE : MAX_SQRT_PRICE);
// }
