import {
  Connection,
  Ed25519Keypair,
  JsonRpcProvider,
  RawSigner,
  TransactionBlock,
} from "@mysten/sui.js";
import { TurbosPool } from "./turbos";

const pool = new TurbosPool(
  "0x5eb2dfcdd1b15d2021328258f6d5ec081e9a0cdcfa9e13a0eaeb9b5f7505ca78",
  "0x2::sui::SUI", //coins.SUI,
  "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN", //coins.USDC
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

const a2b: boolean = false;
const amountIn: number = 10000000;
const slippage: number = 0;
const amountSpecifiedIsInput: boolean = true;

let transactionBlock: TransactionBlock;
const getTransactionBlock = async () => {
  transactionBlock = await pool.createSwapTransaction({
    a2b,
    amountIn,
    amountSpecifiedIsInput,
    slippage,
  });
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
