import {
  Connection,
  Ed25519Keypair,
  JsonRpcProvider,
  RawSigner,
  TransactionBlock,
} from "@mysten/sui.js";
import { coins } from "../..";
import { CetusPool } from "./cetus";

let transactionBlock: TransactionBlock = new TransactionBlock();

// USDC -> SUI
const USDCtoSUI = new CetusPool(
  "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630",
  coins.USDC,
  coins.SUI
);

// SUI -> CETUS
const CETUStoSUI = new CetusPool(
  "0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded",
  coins.CETUS,
  coins.SUI
);

// CETUS -> USDC
const USDCtoCETUS = new CetusPool(
  "0x238f7e4648e62751de29c982cbf639b4225547c31db7bd866982d7d56fc2c7a8",
  coins.USDC,
  coins.CETUS
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
const amountIn: number = 10000;
const amountOut: number = 10000;
const byAmountIn: boolean = true;
const slippage: number = 5; // Allow for 5% slippage (??)

const getUSDCtoSUITransactionBlock = async () => {
  const txb = await USDCtoSUI.createSwapTransaction(
    a2b,
    amountIn,
    amountOut,
    byAmountIn,
    slippage
  );
  if (typeof txb !== "undefined") transactionBlock = txb;
};

a2b = false;
const getCETUStoSUITransactionBlock = async () => {
  const txb = await CETUStoSUI.createSwapTransaction(
    a2b,
    amountIn,
    amountOut,
    byAmountIn,
    slippage
  );
  if (typeof txb !== "undefined") transactionBlock = txb;
};

getUSDCtoSUITransactionBlock().then((res) => {
  getCETUStoSUITransactionBlock().then((res) => {
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
});
