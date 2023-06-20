import {
  JsonRpcProvider,
  SUI_CLOCK_OBJECT_ID,
  TransactionArgument,
  TransactionBlock,
  mainnetConnection,
} from "@mysten/sui.js";
import { keypair } from "../../index";
import { buildInputCoinForAmount } from "../../utils/utils";
import { mainnet } from "../cetus/mainnet_config";
import { testnet } from "../cetus/testnet_config";
import { suiswapConfig } from "../dexsConfig";
import { SuiswapParams } from "../dexsParams";
import { Pool, PreswapResult } from "../pool";

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

export class Suiwap extends Pool<SuiswapParams> {
  private package: string;
  private module: string;
  private senderAddress: string;

  constructor(address: string, coinTypeA: string, coinTypeB: string) {
    super(address, coinTypeA, coinTypeB);
    this.senderAddress = keypair.getPublicKey().toSuiAddress();

    this.package = suiswapConfig.contract.PackageId;
    this.module = suiswapConfig.contract.ModuleId;
  }

  async createSwapTransaction(
    params: SuiswapParams
  ): Promise<TransactionBlock | undefined> {
    const txb = await this.createTransactionBlock(params.a2b, params.amountIn);
    return txb;
  }

  async createTransactionBlock(
    a2b: boolean,
    amountIn: number
  ): Promise<TransactionBlock | undefined> {
    console.log(
      `Swap: (${amountIn}) [${a2b ? this.coinTypeA : this.coinTypeB}], 
       To: [${!a2b ? this.coinTypeA : this.coinTypeB}], 
       pool: ${this.uri}`
    );
    const admin = process.env.ADMIN_ADDRESS;

    let provider = new JsonRpcProvider(mainnetConnection);

    const functionName = a2b ? "swap_x_to_y" : "swap_y_to_x";

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
          transactionBlock.object(this.uri),
          transactionBlock.makeMoveVec({
            objects: coins,
          }),
          transactionBlock.pure(amountIn.toFixed(0), "u64"),
          transactionBlock.pure(0, "u64"),
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
    return {
      estimatedAmountIn: 0,
      estimatedAmountOut: 0,
      estimatedFeeAmount: 0,
    };
  }

  async estimatePrice(): Promise<number> {
    return 0 ** 2 / 2 ** 128;
  }
}
