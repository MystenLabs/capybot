import {
  Connection,
  Ed25519Keypair,
  JsonRpcProvider,
  RawSigner,
  TransactionBlock,
} from "@mysten/sui.js";
import { coins } from "../..";
import { Suiwap } from "./suiswap";

// SUI - USDC	0xddb2164a724d13690e347e9078d4234c9205b396633dfc6b859b09b61bbcd257
// WETH - SUI	0x53a7cc598695854020701cc12cdfd0f0d04b84415d6e21b6240aa8091484b1e1
// SUI - USDT	0x86cd3d51e8d8d59674c3efae0454db1eceffb0afab896e3d0442d39949d59790
// USDCsol - USDC	0x2d87656c2a116b04a790abade9a66bee2abf184c2d0f1abed6e0b1196e136769
// WETH - USDC	0x1937e826d0e546e8e0ea7511d0abfde86a2b64b68ca8f504b8059e800bf167f0
// USDC - USDT	0x08948c60f307c52f8f9dc5b2a6a832feef159318998e375560d3187c1c25fbce

let transactionBlock: TransactionBlock = new TransactionBlock();

// USDC -> SUI
const USDCtoSUI = new Suiwap(
  "0xddb2164a724d13690e347e9078d4234c9205b396633dfc6b859b09b61bbcd257",
  coins.SUI,
  coins.USDC
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

const getSUItoUSDCTransactionBlock = async () => {
  const txb = await USDCtoSUI.createSwapTransaction(a2b, amountIn);
  if (typeof txb !== "undefined") {
    transactionBlock = txb;
    await signer
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
  }
};

getSUItoUSDCTransactionBlock().then(() => {
  console.log("done");
});
