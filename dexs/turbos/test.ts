import {
  Connection,
  Ed25519Keypair,
  JsonRpcProvider,
  RawSigner,
  TransactionBlock,
} from "@mysten/sui.js";
import { coins } from "../..";
import { TurbosPool } from "./turbos";

let transactionBlock: TransactionBlock = new TransactionBlock();

// SUI -> USDT
const SUItoUSDT = new TurbosPool(
  "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630",
  coins.USDC,
  coins.SUI,
  "0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1::fee3000bps::FEE3000BPS"
);

const phrase = process.env.ADMIN_PHRASE;
const keypair = Ed25519Keypair.deriveKeypair(phrase!);

let provider = new JsonRpcProvider(
  new Connection({
    fullnode: "https://fullnode.mainnet.sui.io",
  })
);
const signer = new RawSigner(keypair, provider);

let a2b: boolean = true;
const amountIn: number = 1000000000;
const amountSpecifiedIsInput: boolean = true;
const slippage: number = 5; // Allow for 5% slippage (??)

const getSUItoUSDTTransactionBlock = async () => {
  const txb = await SUItoUSDT.createSwapTransaction({
    a2b,
    amountIn,
    amountSpecifiedIsInput,
    slippage,
  });
  if (typeof txb !== "undefined") transactionBlock = txb;
};

getSUItoUSDTTransactionBlock().then(() => {
  signer
    .signAndExecuteTransactionBlock({
      transactionBlock: transactionBlock,
      requestType: "WaitForLocalExecution",
      options: {
        showObjectChanges: true,
        showEffects: true,
      },
    })
    .then(function (res: any) {
      console.log("executed! result = ", res);
    });
});
