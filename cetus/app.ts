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
  amountIn: number;
  amountLimit: number;
  coinTypeA: string;
  coinTypeB: string;
  a2b: boolean;
};

let swapParams: SwapParams;
// testnet || mainnet
const network: string = "testnet";

swapParams = {
  network: "https://rpc.testnet.sui.io:443",
  package: "0x0f01bbc958a275421f817c498322c369e290bbe7c96a590d809667322e0fc7d1",
  module: "pool_script",
  globalConfig:
    "0x6f4149091a5aea0e818e7243a13adcfb403842d670b9a2089de058512620687a",
  pool: "0x74dcb8625ddd023e2ef7faf1ae299e3bc4cb4c337d991a5326751034676acdae",
  byAmountIn: true,
  amountIn: 10000000,
  amountLimit: 0,
  coinTypeA:
    "0x26b3bc67befc214058ca78ea9a2690298d731a2d4309485ec3d40198063c4abc::usdc::USDC",
  coinTypeB:
    "0x26b3bc67befc214058ca78ea9a2690298d731a2d4309485ec3d40198063c4abc::eth::ETH",
  a2b: true,
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

const txb = new TransactionBlock();
// txb.setGasBudget(1500000000);

const functionName = swapParams.a2b ? "swap_a2b" : "swap_b2a";
const sqrtPriceLimit = getDefaultSqrtPriceLimit(true);
console.log(`${swapParams.package}::${swapParams.module}::${functionName}`);

let coinsArray: string[] = [];
// const coins = async () => {
//   coinsArray = await selectTradeCoins(
//     provider,
//     admin!,
//     swapParams.a2b ? swapParams.coinTypeA : swapParams.coinTypeB,
//     new Decimal(swapParams.amountIn)
//   );
// };

// coins().then((res) => {
//   console.log("coins:", coinsArray);
//   console.log(coinsArray.map((id) => txb.object(id)));
// });
coinsArray.push(
  "0x469b7c9a6e6cab7e09098aa118cc3a087e0c0d510d41968a58f1b04ea99eb7b3"
);

txb.moveCall({
  target: `${swapParams.package}::${swapParams.module}::${functionName}`,
  arguments: [
    txb.object(swapParams.globalConfig),
    txb.object(swapParams.pool),

    txb.makeMoveVec({
      objects: coinsArray.map((id) => txb.object(id)),
    }),

    // txb.makeMoveVec({
    //   objects: convertTradeCoins(
    //     txb,
    //     ["0x469b7c9a6e6cab7e09098aa118cc3a087e0c0d510d41968a58f1b04ea99eb7b3"],
    //     swapParams.a2b ? swapParams.coinTypeA : swapParams.coinTypeB,
    //     new Decimal(swapParams.amountIn)
    //   ),
    // }),

    txb.pure(swapParams.byAmountIn),
    txb.pure(swapParams.amountIn),
    txb.pure(swapParams.amountLimit),
    txb.pure(sqrtPriceLimit.toString()),
    txb.object(SUI_CLOCK_OBJECT_ID),
  ],
  typeArguments: swapParams.a2b
    ? [swapParams.coinTypeA, swapParams.coinTypeB]
    : [swapParams.coinTypeB, swapParams.coinTypeA],
});

signer
  .signAndExecuteTransactionBlock({
    transactionBlock: txb,
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
