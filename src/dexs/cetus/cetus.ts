import SDK, {
  Percentage,
  SdkOptions,
  adjustForSlippage,
  d,
} from "@cetusprotocol/cetus-sui-clmm-sdk/dist";
import {
  JsonRpcProvider,
  TransactionBlock,
  mainnetConnection,
} from "@mysten/sui.js";
import BN from "bn.js";
import { getCoinInfo } from "../../coins/coins";
import { keypair } from "../../index";
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
    this.sdk.senderAddress = keypair.getPublicKey().toSuiAddress();

    this.package = cetusConfig.contract.PackageId;
    this.module = cetusConfig.contract.ModuleId;
    this.globalConfig = cetusConfig.contract.GlobalConfig;
    this.provider = new JsonRpcProvider(mainnetConnection);
    this.ownerAddress = process.env.ADMIN_ADDRESS!;
  }

  async createSwapTransaction(params: CetusParams): Promise<TransactionBlock> {
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

    if (params.amountIn > 0 && Number(totalBalance) >= params.amountIn) {
      console.log(
        `a2b: ${params.a2b}, amountIn: ${params.amountIn}, amountOut: ${params.amountOut}, byAmountIn: ${params.byAmountIn}, slippage: ${params.slippage}`
      );

      // fix input token amount
      const coinAmount = new BN(params.amountIn);
      // input token amount is token a
      const byAmountIn = true;
      // slippage value
      const slippage = Percentage.fromDecimal(d(5));
      // Fetch pool data
      const pool = await this.sdk.Pool.getPool(this.uri);
      // Estimated amountIn amountOut fee

      // Load coin info
      let coinA = getCoinInfo(this.coinTypeA);
      let coinB = getCoinInfo(this.coinTypeB);

      const res: any = await this.sdk.Swap.preswap({
        a2b: params.a2b,
        amount: coinAmount.toString(),
        by_amount_in: byAmountIn,
        coinTypeA: this.coinTypeA,
        coinTypeB: this.coinTypeB,
        current_sqrt_price: pool.current_sqrt_price,
        decimalsA: coinA.decimals,
        decimalsB: coinB.decimals,
        pool: pool,
      });

      const toAmount = byAmountIn
        ? res.estimatedAmountOut
        : res.estimatedAmountIn;
      // const amountLimit = adjustForSlippage(toAmount, slippage, !byAmountIn);

      const amountLimit = adjustForSlippage(
        new BN(toAmount),
        slippage,
        !byAmountIn
      );

      // build swap Payload
      const transactionBlock: TransactionBlock =
        await this.sdk.Swap.createSwapTransactionPayload({
          pool_id: pool.poolAddress,
          coinTypeA: pool.coinTypeA,
          coinTypeB: pool.coinTypeB,
          a2b: params.a2b,
          by_amount_in: byAmountIn,
          amount: res.amount.toString(),
          amount_limit: amountLimit.toString(),
        });

      return transactionBlock;
    }
    return new TransactionBlock();
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
    return pool.current_sqrt_price ** 2 / 2 ** 128;
  }
}
