import BN from "bn.js";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

import {
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
} from "@cetusprotocol/cetus-sui-clmm-sdk/dist";
import {
  Connection,
  Ed25519Keypair,
  JsonRpcProvider,
  RawSigner,
  SUI_CLOCK_OBJECT_ID,
  TransactionBlock,
} from "@mysten/sui.js";

type SwapParams = {
  network: string;
  package: string;
  module: string;
  globalConfig: string;
  pool: string;
  byAmountIn: boolean;
  amount: number;
  amountLimit: number;
  coinTypeA: string;
  coinTypeB: string;
  a2b: boolean;
};

let swapParams: SwapParams;
// testnet || mainnet
const network: string = "testnet";
if (network === "mainnet") {
  swapParams = {
    network: "https://rpc.mainnet.sui.io:443",
    package:
      "0xe18f7c41e055692946d2bbaf1531af76d297473d2c2c110a0840befec5960be1",
    module: "pool_script",
    globalConfig: "",
    pool: "",
    byAmountIn: true,
    amount: 0,
    amountLimit: 0,
    coinTypeA: "",
    coinTypeB: "0x2::sui::SUI",
    a2b: true,
  };
} else {
  swapParams = {
    network: "https://rpc.testnet.sui.io:443",
    package:
      "0x0f01bbc958a275421f817c498322c369e290bbe7c96a590d809667322e0fc7d1",
    module: "pool_script",
    globalConfig:
      "0x6f4149091a5aea0e818e7243a13adcfb403842d670b9a2089de058512620687a",
    pool: "0x74dcb8625ddd023e2ef7faf1ae299e3bc4cb4c337d991a5326751034676acdae",
    byAmountIn: true,
    amount: 10000000,
    amountLimit: 0,
    coinTypeA:
      "0x26b3bc67befc214058ca78ea9a2690298d731a2d4309485ec3d40198063c4abc::usdc::USDC",
    coinTypeB:
      "0x26b3bc67befc214058ca78ea9a2690298d731a2d4309485ec3d40198063c4abc::eth::ETH",
    a2b: true,
  };
}

const phrase = process.env.ADMIN_PHRASE;
const keypair = Ed25519Keypair.deriveKeypair(phrase!);

const connOptions = new Connection({
  fullnode: swapParams.network,
});
console.log("Connecting to ", swapParams.network);

let provider = new JsonRpcProvider(connOptions);
const signer = new RawSigner(keypair, provider);

const tx = new TransactionBlock();
tx.setGasBudget(1500000000);

const functionName = swapParams.a2b ? "swap_a2b" : "swap_b2a";
const sqrtPriceLimit = getDefaultSqrtPriceLimit(true);
console.log(`${swapParams.package}::${swapParams.module}::${functionName}`);

tx.moveCall({
  target: `${swapParams.package}::${swapParams.module}::${functionName}`,
  arguments: [
    tx.object(swapParams.globalConfig),
    tx.object(swapParams.pool),
    tx.makeMoveVec({
      objects: [
        tx.object(
          "0x469b7c9a6e6cab7e09098aa118cc3a087e0c0d510d41968a58f1b04ea99eb7b3"
        ),
      ],
    }),
    tx.pure(swapParams.byAmountIn),
    tx.pure(swapParams.amount),
    tx.pure(swapParams.amountLimit),
    tx.pure(sqrtPriceLimit.toString()),
    tx.object(SUI_CLOCK_OBJECT_ID),
  ],
  typeArguments: swapParams.a2b
    ? [swapParams.coinTypeA, swapParams.coinTypeB]
    : [swapParams.coinTypeB, swapParams.coinTypeA],
});

signer
  .signAndExecuteTransactionBlock({
    transactionBlock: tx,
    requestType: "WaitForLocalExecution",
    options: {
      showObjectChanges: true,
      showEffects: true,
    },
  })
  .then(function (res) {
    console.log("executed! result = ", res);
  });
function getDefaultSqrtPriceLimit(a2b: boolean): BN {
  return new BN(a2b ? MIN_SQRT_PRICE : MAX_SQRT_PRICE);
}

// function buildCoinInputForAmount(
//   tx: TransactionBlock,
//   amount: bigint,
//   coinType: string,
//   buildVector = true
// ): BuildCoinInputResult | undefined {
// //   CoinAsset = {
// //     coinAddress: SuiAddressType;
// //     coinObjectId: SuiObjectIdType;
// //     balance: bigint;
// // }
//   const allCoins = await provider.getAllCoins({
//     owner: admin,
//   });
//   const coinAssets = await provider.getCoins({
//     owner: admin!,
//     coinType,
//   });

//   if (amount === BigInt(0)) {
//     return undefined;
//   }
//   // console.log(coinAssets)
//   const amountTotal = await provider.getBalance({
//     owner: admin,
//     coinType,
//   });
//   if (amountTotal < amount) {
//     throw new Error(
//       `The amount(${amountTotal}) is Insufficient balance for ${coinType} , expect ${amount} `
//     );
//   }

//   // SUI
//   if (CoinAssist.isSuiCoin(coinType)) {
//     const amountCoin = tx.splitCoins(tx.gas, [tx.pure(amount.toString())]);
//     if (buildVector) {
//       return {
//         transactionArgument: tx.makeMoveVec({ objects: [amountCoin] }),
//         remainCoins: allCoins,
//       };
//     }
//     return {
//       transactionArgument: amountCoin,
//       remainCoins: allCoins,
//     };
//   }
//   // SUI

//   const selectedCoinsResult = CoinAssist.selectCoinObjectIdGreaterThanOrEqual(
//     coinAssets,
//     amount
//   );
//   const coinObjectIds = selectedCoinsResult.objectArray;
//   if (buildVector) {
//     return {
//       transactionArgument: tx.makeMoveVec({
//         objects: coinObjectIds.map((id) => tx.object(id)),
//       }),
//       remainCoins: selectedCoinsResult.remainCoins,
//     };
//   }
//   const [primaryCoinA, ...mergeCoinAs] = coinObjectIds;
//   const primaryCoinAInput: any = tx.object(primaryCoinA);

//   if (mergeCoinAs.length > 0) {
//     tx.mergeCoins(
//       primaryCoinAInput,
//       mergeCoinAs.map((coin) => tx.object(coin))
//     );
//   }

//   return {
//     transactionArgument: primaryCoinAInput,
//     remainCoins: selectedCoinsResult.remainCoins,
//   };
// }
