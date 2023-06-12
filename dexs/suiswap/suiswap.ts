import {
  Connection,
  JsonRpcProvider,
  SUI_CLOCK_OBJECT_ID,
  TransactionBlock,
} from "@mysten/sui.js";
import { keypair } from "../../app";
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

export class SuiswapPool extends Pool {
  preswap(
    a2b: boolean,
    amount: number,
    byAmountIn: boolean
  ): Promise<PreswapResult> {
    throw new Error("Method not implemented.");
  }
  estimatePrice(): Promise<number> {
    throw new Error("Method not implemented.");
  }
  private package: string;
  private module: string;
  private senderAddress: string;

  constructor(address: string, coinTypeA: string, coinTypeB: string) {
    super(address, coinTypeA, coinTypeB);

    this.senderAddress = keypair.getPublicKey().toSuiAddress();
    this.package = mainnet.package;
    this.module = mainnet.module;
  }

  async createSwapTransaction(
    a2b: boolean,
    amountIn: number
  ): Promise<TransactionBlock> {
    const admin = process.env.ADMIN_ADDRESS;

    let provider = new JsonRpcProvider(
      new Connection({
        fullnode: mainnet.fullRpcUrl,
      })
    );

    const txb = new TransactionBlock();
    txb.setGasBudget(500000000);

    const functionName = a2b ? "swap_x_to_y" : "swap_y_to_x";

    const coins = await buildInputCoinForAmount(
      txb,
      BigInt(amountIn),
      a2b ? this.coinTypeA : this.coinTypeB,
      this.senderAddress,
      provider
    );

    txb.moveCall({
      target: `${this.package}::${this.module}::${functionName}`,
      arguments: [
        txb.object(this.address),
        txb.makeMoveVec({
          objects: coins,
        }),
        txb.pure(amountIn.toFixed(0), "u64"),
        txb.pure(0, "u64"),
        txb.object(SUI_CLOCK_OBJECT_ID),
      ],
      typeArguments: [this.coinTypeA, this.coinTypeB],
    });
    return txb;
  }

  // async preswap(
  //   a2b: boolean,
  //   amount: number,
  //   byAmountIn: boolean
  // ): Promise<PreswapResult> {
  //   let pool = await this.sdk.Pool.getPool(this.address);

  //   // Load coin info
  //   let coinA = getCoinInfo(this.coinTypeA);
  //   let coinB = getCoinInfo(this.coinTypeB);

  //   const res: any = await this.sdk.Swap.preswap({
  //     a2b: a2b,
  //     amount: amount.toString(),
  //     by_amount_in: byAmountIn,
  //     coinTypeA: this.coinTypeA,
  //     coinTypeB: this.coinTypeB,
  //     current_sqrt_price: pool.current_sqrt_price,
  //     decimalsA: coinA.decimals,
  //     decimalsB: coinB.decimals,
  //     pool: pool,
  //   });

  //   return {
  //     estimatedAmountIn: res.estimatedAmountIn,
  //     estimatedAmountOut: res.estimatedAmountOut,
  //     estimatedFeeAmount: res.estimatedFeeAmount,
  //   };
  // }

  //   async estimatePrice(): Promise<number> {
  //     let pool = await this.sdk.Pool.getPool(this.address);
  //     // current_sqrt_price is stored in Q64 format on Cetus
  //     return pool.current_sqrt_price ** 2 / 2 ** 128;
  //   }
}
