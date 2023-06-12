import {
  Connection,
  Ed25519Keypair,
  JsonRpcProvider,
  RawSigner,
  SUI_CLOCK_OBJECT_ID,
  TransactionArgument,
  TransactionBlock,
} from "@mysten/sui.js";

import Decimal from "decimal.js";

type SwapParams = {
  network: string;
  package: string;
  module: string;
  pool: string;
  a2b: boolean;
  amountIn: number;
  slippage: string;
  amountSpecifiedIsInput: boolean;
  type0: string;
  type1: string;
};

// export interface SwapOptions {
//   routes: { pool: string; aToB: boolean; nextTickIndex: number }[];
//   coinTypeA: string;
//   coinTypeB: string;
//   address: SuiAddress;
//   amountIn: Decimal.Value;
//   amountOut: Decimal.Value;
//   amountSpecifiedIsInput: boolean;
//   slippage: string;
//   signAndExecute: (
//     txb: TransactionBlock,
//     provider: JsonRpcProvider
//   ) => Promise<SuiTransactionBlockResponse>;
// }

// https://s3.amazonaws.com/app.turbos.finance/sdk/contract.json
let swapParams: SwapParams;
// testnet || mainnet

swapParams = {
  network: "https://rpc.mainnet.sui.io:443",
  package: "0xd075d51486df71e750872b4edf82ea3409fda397ceecc0b6aedf573d923c54a0",
  module: "pool",
  pool: "0xddb2164a724d13690e347e9078d4234c9205b396633dfc6b859b09b61bbcd257",
  a2b: true,
  amountIn: 1000000000,
  slippage: "0",
  amountSpecifiedIsInput: true,
  type0: "0x2::sui::SUI",
  type1:
    "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
};

const phrase = process.env.ADMIN_PHRASE;
const keypair = Ed25519Keypair.deriveKeypair(phrase!);

const connOptions = new Connection({
  fullnode: swapParams.network,
});
console.log("Connecting to ", swapParams.network);

let provider = new JsonRpcProvider(connOptions);
const signer = new RawSigner(keypair, provider);

const txb = new TransactionBlock();
txb.setGasBudget(1500000000);

const functionName = "swap_x_to_y";
console.log(`${swapParams.package}::${swapParams.module}::${functionName}`);

// https://github.com/turbos-finance/turbos-clmm-sdk/blob/main/src/lib/trade.ts
// suiexplorer.com/object/0xcc1e9ec515810773ac9ad2ae41194ab0166300d9071a09a22cd8eb152138a3b3?network=testnet
txb.moveCall({
  target: `${swapParams.package}::${swapParams.module}::${functionName}`,
  arguments: [
    // Arg0: & mut Pool<Ty0, Ty1, Ty2>
    txb.object(swapParams.pool),
    // Arg1: vector<Coin<Ty0>>
    // txb.makeMoveVec({ objects: this.coin.convertTradeCoins(txb, coinIds, coinTypeA, amountIn), })
    txb.makeMoveVec({
      objects: convertTradeCoins(
        txb,
        ["0x1d9559c803d878e580e69e57a6093513eba2bbef39e7a52c46401d700b838f26"],
        swapParams.type0,
        new Decimal(swapParams.amountIn)
      ),
    }),
    // Arg2: u64
    txb.pure(swapParams.amountIn.toFixed(0), "u64"),
    // Arg3: u64
    txb.pure(swapParams.amountIn.toFixed(0), "u64"),
    // Arg8: & Clock
    // txb.object(SUI_CLOCK_OBJECT_ID)
    txb.object(SUI_CLOCK_OBJECT_ID),
  ],
  typeArguments: [swapParams.type0, swapParams.type1],
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

function isSUI(coinType: string) {
  return coinType.toLowerCase().indexOf("sui") > -1;
}

function convertTradeCoins(
  txb: TransactionBlock,
  coinIds: string[],
  coinType: string,
  amount: Decimal
): TransactionArgument[] {
  return isSUI(coinType)
    ? [txb.splitCoins(txb.gas, [txb.pure(amount.toNumber())])[0]!]
    : coinIds.map((id) => txb.object(id));
}

async function getMetadata(provider: JsonRpcProvider, coinType: string) {
  const result = await provider.getCoinMetadata({ coinType });
  if (!result) {
    throw new Error(`Coin "${coinType}" is not found`);
  }
  return result;
}
