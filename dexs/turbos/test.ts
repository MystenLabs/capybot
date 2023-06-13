import {
  Connection,
  Ed25519Keypair,
  JsonRpcProvider,
  RawSigner,
  TransactionBlock,
} from "@mysten/sui.js";
import { TurbosPool } from "./turbos";

const pool = new TurbosPool(
  "0x86ed41e9b4c6cce36de4970cfd4ae3e98d6281f13a1b16aa31fc73ec90079c3d",
  "0x2::sui::SUI", //coins.SUI,
  "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN", //coins.USDC
  "0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1::fee3000bps::FEE3000BPS",
  true
);

const phrase = process.env.ADMIN_PHRASE;
const keypair = Ed25519Keypair.deriveKeypair(phrase!);

let provider = new JsonRpcProvider(
  new Connection({
    fullnode: "https://fullnode.mainnet.sui.io",
  })
);
const signer = new RawSigner(keypair, provider);

const a2b: boolean = true;
const amountIn: number = 100000;
const slippage: number = 0;
const amountSpecifiedIsInput: boolean = true;

let transactionBlock: TransactionBlock;
const getTransactionBlock = async () => {
  transactionBlock = await pool.createSwapTransaction({
    transactionBlock,
    amountIn,
    amountSpecifiedIsInput,
    slippage,
  });
};

getTransactionBlock().then((res) => {
  // signer
  //   .signAndExecuteTransactionBlock({
  //     transactionBlock: transactionBlock,
  //     requestType: "WaitForLocalExecution",
  //     options: {
  //       showObjectChanges: true,
  //       showEffects: true,
  //     },
  //   })
  //   .then(function (res: any) {
  //     console.log("executed! result = ", res);
  //   });
});
