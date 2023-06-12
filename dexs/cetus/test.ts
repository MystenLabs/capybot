import {
  Connection,
  Ed25519Keypair,
  JsonRpcProvider,
  RawSigner,
  TransactionBlock,
} from "@mysten/sui.js";
import { CetusPool } from "./cetus";

const pool = new CetusPool(
  "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630",
  "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN", //coins.USDC
  "0x2::sui::SUI" //coins.SUI
);

const phrase = process.env.ADMIN_PHRASE;
const keypair = Ed25519Keypair.deriveKeypair(phrase!);

let provider = new JsonRpcProvider(
  new Connection({
    fullnode: "https://fullnode.mainnet.sui.io",
  })
);
const signer = new RawSigner(keypair, provider);

let transactionBlock: TransactionBlock;
const getTransactionBlock = async () => {
  transactionBlock = await pool.createSwapTransaction(
    true,
    1000,
    1000,
    true,
    5 // Allow for 5% slippage (??)
  );
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
