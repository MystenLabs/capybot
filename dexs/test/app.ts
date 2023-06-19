import BN from "bn.js";

import SDK, {
  Percentage,
  adjustForSlippage,
  d,
} from "@cetusprotocol/cetus-sui-clmm-sdk/dist";
import {
  Connection,
  Ed25519Keypair,
  JsonRpcProvider,
  RawSigner,
  TransactionBlock,
} from "@mysten/sui.js";
import { getCoinInfo } from "../../coins/coins";
import { mainnet } from "../cetus/mainnet_config";

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

// 0x2eeaab737b37137b94bfa8f841f92e36a153641119da3456dec1926b9960d9be::pool_script::swap_b2a
swapParams = {
  network: "https://rpc.mainnet.sui.io:443",
  package: "0x2eeaab737b37137b94bfa8f841f92e36a153641119da3456dec1926b9960d9be",
  module: "pool_script",
  globalConfig:
    "0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f",
  pool: "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630",
  byAmountIn: true,
  amountIn: 13159298,
  amountLimit: 0,
  coinTypeA:
    "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
  coinTypeB: "0x2::sui::SUI",
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

const functionName = swapParams.a2b ? "swap_a2b" : "swap_b2a";

//////////////////////////////////////////////
let txb: TransactionBlock;
async function prepareTXB() {
  const sdk = new SDK(mainnet);
  sdk.senderAddress = process.env.ADMIN_ADDRESS!;

  // Whether the swap direction is token a to token b
  const a2b = swapParams.a2b;
  // fix input token amount
  const coinAmount = new BN(120000);
  // input token amount is token a
  const byAmountIn = true;
  // slippage value
  const slippage = Percentage.fromDecimal(d(5));
  // Fetch pool data
  const pool = await sdk.Pool.getPool(swapParams.pool);
  // Estimated amountIn amountOut fee

  // Load coin info
  let coinA = getCoinInfo(swapParams.coinTypeA);
  let coinB = getCoinInfo(swapParams.coinTypeB);

  const res: any = await sdk.Swap.preswap({
    a2b: a2b,
    amount: coinAmount.toString(),
    by_amount_in: byAmountIn,
    coinTypeA: swapParams.coinTypeA,
    coinTypeB: swapParams.coinTypeB,
    current_sqrt_price: pool.current_sqrt_price,
    decimalsA: coinA.decimals,
    decimalsB: coinB.decimals,
    pool: pool,
  });

  const toAmount = byAmountIn ? res.estimatedAmountOut : res.estimatedAmountIn;
  // const amountLimit = adjustForSlippage(toAmount, slippage, !byAmountIn);

  const amountLimit = adjustForSlippage(
    new BN(toAmount),
    slippage,
    !byAmountIn
  );

  // build swap Payload
  txb = await sdk.Swap.createSwapTransactionPayload({
    pool_id: pool.poolAddress,
    coinTypeA: pool.coinTypeA,
    coinTypeB: pool.coinTypeB,
    a2b: swapParams.a2b,
    by_amount_in: byAmountIn,
    amount: res.amount.toString(),
    amount_limit: amountLimit.toString(),
  });
}

//////////////////////////////////////////////

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
