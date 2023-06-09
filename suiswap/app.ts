import BN from "bn.js";

import {
  Connection,
  Ed25519Keypair,
  JsonRpcProvider,
  PaginatedCoins,
  RawSigner,
  SUI_CLOCK_OBJECT_ID,
  SuiAddress,
  TransactionArgument,
  TransactionBlock,
} from "@mysten/sui.js";

import Decimal from "decimal.js";

const ONE_MINUTE = 60 * 1000;

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
const network: string = "testnet";
if (network === "mainnet") {
  swapParams = {
    network: "https://rpc.mainnet.sui.io:443",
    package:
      "0xe18f7c41e055692946d2bbaf1531af76d297473d2c2c110a0840befec5960be1",
    module: "swap_router",
    pool: "",
    a2b: true,
    amountIn: 0,
    slippage: "0",
    amountSpecifiedIsInput: true,
    type0: "",
    type1: "0x2::sui::SUI",
  };
} else {
  swapParams = {
    network: "https://rpc.testnet.sui.io:443",
    package:
      "0xd075d51486df71e750872b4edf82ea3409fda397ceecc0b6aedf573d923c54a0",
    module: "pool",
    pool: "0xddb2164a724d13690e347e9078d4234c9205b396633dfc6b859b09b61bbcd257",
    a2b: false,
    amountIn: 100000000,
    slippage: "0",
    amountSpecifiedIsInput: true,
    type0: "0x2::sui::SUI",
    type1:
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
  };
}

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

const functionName = "swap_x_to_y_tag";
console.log(`${swapParams.package}::${swapParams.module}::${functionName}`);

// https://github.com/turbos-finance/turbos-clmm-sdk/blob/main/src/lib/trade.ts
// suiexplorer.com/object/0xcc1e9ec515810773ac9ad2ae41194ab0166300d9071a09a22cd8eb152138a3b3?network=testnet
txb.moveCall({
  target: `${swapParams.package}::${swapParams.module}::${functionName}`,
  arguments: [
    // Arg0: & mut Pool<Ty0, Ty1, Ty2>
    // ...routes.map(({ pool }) => txb.object(pool))
    txb.object(swapParams.pool),
    // Arg1: vector<Coin<Ty0>>
    // txb.makeMoveVec({ objects: this.coin.convertTradeCoins(txb, coinIds, coinTypeA, amountIn), })
    txb.makeMoveVec({
      objects: convertTradeCoins(
        txb,
        ["0x91e717011e916384d89bf11c11cc0a5ff0cb3e92a0ea58ee72e595e673a279eb"],
        swapParams.type1,
        new Decimal(swapParams.amountIn)
      ),
    }),
    // Arg2: u64
    txb.pure(swapParams.amountIn.toFixed(0), "u64"),
    // Arg3: u64
    txb.pure(
      amountOutWithSlippage(
        swapParams.amountIn,
        swapParams.slippage,
        swapParams.amountSpecifiedIsInput
      ),
      "u64"
    ),

    // Arg4: u128
    txb.pure(
      tickIndexToSqrtPriceX64(
        swapParams.a2b ? MIN_TICK_INDEX : MAX_TICK_INDEX
      ).toString(),
      "u128"
    ),

    // Arg5: bool
    // txb.pure(amountSpecifiedIsInput, 'bool')
    txb.pure(swapParams.amountSpecifiedIsInput, "bool"),
    // Arg6: address
    // txb.object(address)
    txb.object(
      "0xa7536c86055012cb7753fdb08ecb6c8bf1eb735ad75a2e1980309070123d5ef6"
    ),
    // Arg7: u64
    // txb.pure(Date.now() + ONE_MINUTE * 3, 'u64')
    txb.pure(Date.now() + ONE_MINUTE * 3, "u64"),
    // Arg8: & Clock
    // txb.object(SUI_CLOCK_OBJECT_ID)
    txb.object(SUI_CLOCK_OBJECT_ID),
  ],
  typeArguments: [swapParams.type0, swapParams.type1, swapParams.type2],
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

// function getSqrtPrices(nextTickIndex: number, coinA, coinB, aToB) {
//   const nextTickPrice = tickIndexToPrice(
//     nextTickIndex,
//     coinA.decimals,
//     coinB.decimals
//   );
//   return sqrtPriceWithSlippage(
//     nextTickPrice,
//     swapParams.slippage,
//     aToB,
//     coinA.decimals,
//     coinB.decimals
//   );
// }

function tickIndexToPrice(
  tickIndex: number,
  decimalsA: number,
  decimalsB: number
): Decimal {
  return sqrtPriceX64ToPrice(
    tickIndexToSqrtPriceX64(tickIndex),
    decimalsA,
    decimalsB
  );
}

function sqrtPriceX64ToPrice(
  sqrtPriceX64: BN,
  decimalsA: number,
  decimalsB: number
): Decimal {
  return new Decimal(sqrtPriceX64.toString())
    .mul(Decimal.pow(2, -64))
    .pow(2)
    .mul(Decimal.pow(10, decimalsA - decimalsB));
}

function tickIndexToSqrtPriceX64(tickIndex: number): BN {
  if (tickIndex > 0) {
    return new BN(tickIndexToSqrtPricePositive(tickIndex));
  } else {
    return new BN(tickIndexToSqrtPriceNegative(tickIndex));
  }
}

function tickIndexToSqrtPriceNegative(tickIndex: number) {
  let tick = Math.abs(tickIndex);
  let ratio: BN;

  if ((tick & 1) != 0) {
    ratio = new BN("18445821805675392311");
  } else {
    ratio = new BN("18446744073709551616");
  }

  if ((tick & 2) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18444899583751176498")),
      64,
      256
    );
  }
  if ((tick & 4) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18443055278223354162")),
      64,
      256
    );
  }
  if ((tick & 8) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18439367220385604838")),
      64,
      256
    );
  }
  if ((tick & 16) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18431993317065449817")),
      64,
      256
    );
  }
  if ((tick & 32) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18417254355718160513")),
      64,
      256
    );
  }
  if ((tick & 64) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18387811781193591352")),
      64,
      256
    );
  }
  if ((tick & 128) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18329067761203520168")),
      64,
      256
    );
  }
  if ((tick & 256) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18212142134806087854")),
      64,
      256
    );
  }
  if ((tick & 512) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("17980523815641551639")),
      64,
      256
    );
  }
  if ((tick & 1024) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("17526086738831147013")),
      64,
      256
    );
  }
  if ((tick & 2048) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("16651378430235024244")),
      64,
      256
    );
  }
  if ((tick & 4096) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("15030750278693429944")),
      64,
      256
    );
  }
  if ((tick & 8192) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("12247334978882834399")),
      64,
      256
    );
  }
  if ((tick & 16384) != 0) {
    ratio = signedShiftRight(ratio.mul(new BN("8131365268884726200")), 64, 256);
  }
  if ((tick & 32768) != 0) {
    ratio = signedShiftRight(ratio.mul(new BN("3584323654723342297")), 64, 256);
  }
  if ((tick & 65536) != 0) {
    ratio = signedShiftRight(ratio.mul(new BN("696457651847595233")), 64, 256);
  }
  if ((tick & 131072) != 0) {
    ratio = signedShiftRight(ratio.mul(new BN("26294789957452057")), 64, 256);
  }
  if ((tick & 262144) != 0) {
    ratio = signedShiftRight(ratio.mul(new BN("37481735321082")), 64, 256);
  }

  return ratio;
}

function tickIndexToSqrtPricePositive(tick: number) {
  let ratio: BN;

  if ((tick & 1) != 0) {
    ratio = new BN("79232123823359799118286999567");
  } else {
    ratio = new BN("79228162514264337593543950336");
  }

  if ((tick & 2) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79236085330515764027303304731")),
      96,
      256
    );
  }
  if ((tick & 4) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79244008939048815603706035061")),
      96,
      256
    );
  }
  if ((tick & 8) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79259858533276714757314932305")),
      96,
      256
    );
  }
  if ((tick & 16) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79291567232598584799939703904")),
      96,
      256
    );
  }
  if ((tick & 32) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79355022692464371645785046466")),
      96,
      256
    );
  }
  if ((tick & 64) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79482085999252804386437311141")),
      96,
      256
    );
  }
  if ((tick & 128) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79736823300114093921829183326")),
      96,
      256
    );
  }
  if ((tick & 256) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("80248749790819932309965073892")),
      96,
      256
    );
  }
  if ((tick & 512) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("81282483887344747381513967011")),
      96,
      256
    );
  }
  if ((tick & 1024) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("83390072131320151908154831281")),
      96,
      256
    );
  }
  if ((tick & 2048) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("87770609709833776024991924138")),
      96,
      256
    );
  }
  if ((tick & 4096) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("97234110755111693312479820773")),
      96,
      256
    );
  }
  if ((tick & 8192) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("119332217159966728226237229890")),
      96,
      256
    );
  }
  if ((tick & 16384) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("179736315981702064433883588727")),
      96,
      256
    );
  }
  if ((tick & 32768) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("407748233172238350107850275304")),
      96,
      256
    );
  }
  if ((tick & 65536) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("2098478828474011932436660412517")),
      96,
      256
    );
  }
  if ((tick & 131072) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("55581415166113811149459800483533")),
      96,
      256
    );
  }
  if ((tick & 262144) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("38992368544603139932233054999993551")),
      96,
      256
    );
  }

  return signedShiftRight(ratio, 32, 256);
}

function signedShiftRight(n0: BN, shiftBy: number, bitWidth: number) {
  let twoN0 = n0.toTwos(bitWidth).shrn(shiftBy);
  twoN0.imaskn(bitWidth - shiftBy + 1);
  return twoN0.fromTwos(bitWidth - shiftBy);
}

async function selectTradeCoins(
  provider: JsonRpcProvider,
  owner: SuiAddress,
  coinType: string,
  expectedAmount: Decimal
): Promise<string[]> {
  const coins: PaginatedCoins["data"][number][] = [];
  const coinIds: string[] = [];
  let totalAmount = new Decimal(0);
  let result: PaginatedCoins | undefined;

  do {
    result = await provider.getCoins({
      owner,
      coinType,
      cursor: result?.nextCursor,
    });
    coins.push(...result.data);
  } while (result.hasNextPage);

  coins.sort((a, b) => {
    // From big to small
    return Number(b.balance) - Number(a.balance);
  });

  for (const coin of coins) {
    coinIds.push(coin.coinObjectId);
    totalAmount = totalAmount.add(coin.balance);
    if (totalAmount.gte(expectedAmount)) {
      break;
    }
  }
  return coinIds;
}

function sqrtPriceWithSlippage(
  price: Decimal.Value,
  slippage: string,
  a2b: boolean,
  decimalsA: number,
  decimalsB: number
): string {
  const newPrice = new Decimal(price).mul(
    a2b
      ? new Decimal(100).minus(slippage).div(100)
      : new Decimal(100).plus(slippage).div(100)
  );
  const sqrtPrice = priceToSqrtPriceX64(newPrice, decimalsA, decimalsB);

  if (sqrtPrice.lt(new BN(MIN_SQRT_PRICE))) {
    return MIN_SQRT_PRICE;
  }
  if (sqrtPrice.gt(new BN(MAX_SQRT_PRICE))) {
    return MAX_SQRT_PRICE;
  }
  return sqrtPrice.toString();
}

function priceToSqrtPriceX64(
  price: Decimal.Value,
  decimalsA: number,
  decimalsB: number
): BN {
  return new BN(
    new Decimal(price)
      .mul(Decimal.pow(10, decimalsB - decimalsA))
      .sqrt()
      .mul(Decimal.pow(2, 64))
      .floor()
      .toFixed(0)
  );
}

// function buildCoinInputForAmount(
//   tx: TransactionBlock,
//   amount: bigint,
//   coinType: string,
//   buildVector = true
// ): BuildCoinInputResult | undefined {
// //   CoinAsset = {
// //     coinAddress: SuiAddressType;
// //     coinObjectId: SuiObjectIdType;
// //     balance: bigint;
// // }
//   const allCoins = await provider.getAllCoins({
//     owner: admin,
//   });
//   const coinAssets = await provider.getCoins({
//     owner: admin!,
//     coinType,
//   });

//   if (amount === BigInt(0)) {
//     return undefined;
//   }
//   // console.log(coinAssets)
//   const amountTotal = await provider.getBalance({
//     owner: admin,
//     coinType,
//   });
//   if (amountTotal < amount) {
//     throw new Error(
//       `The amount(${amountTotal}) is Insufficient balance for ${coinType} , expect ${amount} `
//     );
//   }

//   // SUI
//   if (CoinAssist.isSuiCoin(coinType)) {
//     const amountCoin = tx.splitCoins(tx.gas, [tx.pure(amount.toString())]);
//     if (buildVector) {
//       return {
//         transactionArgument: tx.makeMoveVec({ objects: [amountCoin] }),
//         remainCoins: allCoins,
//       };
//     }
//     return {
//       transactionArgument: amountCoin,
//       remainCoins: allCoins,
//     };
//   }
//   // SUI

//   const selectedCoinsResult = CoinAssist.selectCoinObjectIdGreaterThanOrEqual(
//     coinAssets,
//     amount
//   );
//   const coinObjectIds = selectedCoinsResult.objectArray;
//   if (buildVector) {
//     return {
//       transactionArgument: tx.makeMoveVec({
//         objects: coinObjectIds.map((id) => tx.object(id)),
//       }),
//       remainCoins: selectedCoinsResult.remainCoins,
//     };
//   }
//   const [primaryCoinA, ...mergeCoinAs] = coinObjectIds;
//   const primaryCoinAInput: any = tx.object(primaryCoinA);

//   if (mergeCoinAs.length > 0) {
//     tx.mergeCoins(
//       primaryCoinAInput,
//       mergeCoinAs.map((coin) => tx.object(coin))
//     );
//   }

//   return {
//     transactionArgument: primaryCoinAInput,
//     remainCoins: selectedCoinsResult.remainCoins,
//   };
// }
