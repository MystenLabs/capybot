import BN from "bn.js";

import {
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
} from "@cetusprotocol/cetus-sui-clmm-sdk/dist";
import {
  Connection,
  Ed25519Keypair,
  JsonRpcProvider,
  RawSigner,
  TransactionBlock,
} from "@mysten/sui.js";
import { coins } from "../..";
import { CetusPool } from "./cetus";

type SwapParams = {
  network: string;
  package: string;
  module: string;
  globalConfig: string;
  pool: string;
  byAmountIn: boolean;
  amountIn: number;
  amountLimit: number;
  coinTypeA: string;
  coinTypeB: string;
  a2b: boolean;
};

let swapParams: SwapParams;
// testnet || mainnet
const network: string = "testnet";

// 0x2eeaab737b37137b94bfa8f841f92e36a153641119da3456dec1926b9960d9be::pool_script::swap_b2a
swapParams = {
  network: "https://rpc.mainnet.sui.io:443",
  package: "0x2eeaab737b37137b94bfa8f841f92e36a153641119da3456dec1926b9960d9be",
  module: "pool_script",
  globalConfig:
    "0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f",
  pool: "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630",
  byAmountIn: true,
  amountIn: 1315929887,
  amountLimit: 0,
  coinTypeA:
    "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
  coinTypeB: "0x2::sui::SUI",
  a2b: false,
};

const admin = process.env.ADMIN_ADDRESS;
const phrase = process.env.ADMIN_PHRASE;
const keypair = Ed25519Keypair.deriveKeypair(phrase!);

const connOptions = new Connection({
  fullnode: swapParams.network,
});
console.log("Connecting to ", swapParams.network);

let provider = new JsonRpcProvider(connOptions);
const signer = new RawSigner(keypair, provider);

const functionName = swapParams.a2b ? "swap_a2b" : "swap_b2a";
const sqrtPriceLimit = getDefaultSqrtPriceLimit(true);
console.log(`${swapParams.package}::${swapParams.module}::${functionName}`);

// const txb = new TransactionBlock();
// async function prepareTXB() {
//   const coins: TransactionArgument[] | undefined =
//     await buildInputCoinForAmount(
//       txb,
//       BigInt(swapParams.amountIn),
//       swapParams.a2b ? swapParams.coinTypeA : swapParams.coinTypeB,
//       admin!,
//       provider
//     );
//   if (typeof coins !== "undefined") {
//     txb.moveCall({
//       target: `${swapParams.package}::${swapParams.module}::${functionName}`,
//       arguments: [
//         txb.object(swapParams.globalConfig),
//         txb.object(swapParams.pool),

//         // txb.makeMoveVec({
//         //   objects: coinsArray.map((id) => txb.object(id)),
//         // }),

//         // txb.makeMoveVec({
//         //   objects: convertTradeCoins(
//         //     txb,
//         //     [
//         //       "0x00ea20a8c5468be859f12104a0482da7f68973f2a6832f32be2bd05a9079a7e8",
//         //     ],
//         //     swapParams.a2b ? swapParams.coinTypeA : swapParams.coinTypeB,
//         //     new Decimal(swapParams.amountIn)
//         //   ),
//         // }),

//         txb.makeMoveVec({
//           objects: coins,
//         }),

//         txb.pure(swapParams.byAmountIn),
//         txb.pure(swapParams.amountIn),
//         txb.pure(swapParams.amountLimit),
//         txb.pure(sqrtPriceLimit.toString()),
//         txb.object(SUI_CLOCK_OBJECT_ID),
//       ],
//       typeArguments: [swapParams.coinTypeA, swapParams.coinTypeB],
//     });
//   }
// }

// prepareTXB().then((res) => {
//   signer
//     .signAndExecuteTransactionBlock({
//       transactionBlock: txb,
//       requestType: "WaitForLocalExecution",
//       options: {
//         showObjectChanges: true,
//         showEffects: true,
//       },
//     })
//     .then(function (res) {
//       console.log("executed! result = ", res);
//     });
// });

function getDefaultSqrtPriceLimit(a2b: boolean): BN {
  return new BN(a2b ? MIN_SQRT_PRICE : MAX_SQRT_PRICE);
}
// 0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN, 0x2::sui::SUI>
const USDCtoSUI: CetusPool = new CetusPool(
  "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630",
  coins.USDC,
  coins.SUI
);

const a2b: boolean = false;
const amountIn: number = 10000;
const amountOut: number = 0;
const byAmountIn: boolean = true;
const slippage: number = 1;

// let amountOut = Math.round(USDCtoSUI.estimatePrice() * amountIn);

let txb: TransactionBlock | undefined;
async function prepareTXB() {
  txb = await USDCtoSUI.createSwapTransaction({
    a2b,
    amountIn,
    amountOut,
    byAmountIn,
    slippage,
  });
}

prepareTXB().then(() => {
  if (typeof txb !== "undefined") {
    console.log("txb?.blockData", txb?.blockData);
    signer
      .signAndExecuteTransactionBlock({
        transactionBlock: txb,
        requestType: "WaitForLocalExecution",
        options: {
          showObjectChanges: true,
          showEffects: true,
        },
      })
      .then((result) => {
        console.log("executed! result = ", result);
      });
  }
});
