import {
  JsonRpcProvider,
  RawSigner,
  TransactionBlock,
  mainnetConnection,
} from "@mysten/sui.js";
import { Contract, Network, Trade, TurbosSdk } from "turbos-clmm-sdk";

const provider = new JsonRpcProvider(mainnetConnection);
export const sdk = new TurbosSdk(Network.mainnet, provider);

const mnemonic = process.env.ADMIN_PHRASE!;
const keypair = sdk.account.getKeypairFromMnemonics(mnemonic);
const signer = new RawSigner(keypair, provider);

let fees: Contract.Fee[];
async function feesFn() {
  fees = await sdk.contract.getFees(); // Fee[]
}

// feesFn().then(() => {
//   console.log(fees);
// });

//   async computeSwapResult(options: {
//     pool: string;
//     a2b: boolean;
//     address: SuiAddress;
//     amountSpecified: Decimal.Value;
//     amountSpecifiedIsInput: boolean;
//   }): Promise<Trade.ComputedSwapResult>

let swapResult: Trade.ComputedSwapResult;
async function swapResultFn() {
  swapResult = await sdk.trade.computeSwapResult({
    pool: "0x5eb2dfcdd1b15d2021328258f6d5ec081e9a0cdcfa9e13a0eaeb9b5f7505ca78",
    a2b: true,
    address:
      "0xa7536c86055012cb7753fdb08ecb6c8bf1eb735ad75a2e1980309070123d5ef6",
    amountSpecified: 1000000000,
    amountSpecifiedIsInput: true,
  });

  txb = await sdk.trade.swap({
    routes: [
      {
        pool: swapResult.pool,
        aToB: swapResult.a_to_b,
        nextTickIndex: swapResult.tick_current_index.bits,
      },
    ],
    coinTypeA: "0x2::sui::SUI",
    coinTypeB:
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
    address: swapResult.recipient,
    amountIn: swapResult.amount_a,
    amountOut: swapResult.amount_b,
    amountSpecifiedIsInput: true,
    slippage: "0.01",
  });
}

let txb: TransactionBlock;
async function swapFn(sr: Trade.ComputedSwapResult) {
  txb = await sdk.trade.swap({
    routes: [
      {
        pool: sr.pool,
        aToB: sr.a_to_b,
        nextTickIndex: sr.tick_current_index.bits,
      },
    ],
    coinTypeA: "0x2::sui::SUI",
    coinTypeB:
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
    address: sr.recipient,
    amountIn: sr.amount_a,
    amountOut: sr.amount_b,
    amountSpecifiedIsInput: true,
    slippage: "0",
  });

  txb.setGasBudget(1500000000);
  let result = await signer.signAndExecuteTransactionBlock({
    transactionBlock: txb,
    requestType: "WaitForLocalExecution",
    options: {
      showObjectChanges: true,
      showEffects: true,
    },
  });
  console.log("*** *** ***", result);
}

swapResultFn().then(() => {
  console.log("*** *** ***");
  console.log(swapResult);
  console.log("*** *** ***");

  swapFn(swapResult).then(() => {
    console.log("*** *** ***");
    console.log(txb.blockData);
    console.log("*** *** ***");
  });
});
