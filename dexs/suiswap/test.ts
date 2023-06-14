import {
  Connection,
  Ed25519Keypair,
  JsonRpcProvider,
  RawSigner,
  TransactionBlock,
} from "@mysten/sui.js";
import { SuiswapPool } from "./suiswap";

const pool = new SuiswapPool(
  "0xddb2164a724d13690e347e9078d4234c9205b396633dfc6b859b09b61bbcd257",
  "0x2::sui::SUI", //coins.SUI,
  "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN", //coins.USDC
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
const amountIn: number = 10000;

let transactionBlock: TransactionBlock;
const getTransactionBlock = async () => {
  const txb = await pool.createSwapTransaction({
    transactionBlock,
    amountIn,
  });
  if (typeof txb !== "undefined") transactionBlock = txb;
};

getTransactionBlock().then((res) => {
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
