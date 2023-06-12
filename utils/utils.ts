import {
  JsonRpcProvider,
  ObjectId,
  PaginatedCoins,
  SuiAddress,
  TransactionArgument,
  TransactionBlock,
  normalizeSuiObjectId,
} from "@mysten/sui.js";

import Decimal from "decimal.js";

export const SUI_COIN_OBJECT_ID = "0x2::sui::SUI";

export function convertTradeCoins(
  txb: TransactionBlock,
  coinIds: string[],
  coinType: string,
  amount: Decimal
): TransactionArgument[] {
  return isSuiCoin(coinType)
    ? [txb.splitCoins(txb.gas, [txb.pure(amount.toNumber())])[0]!]
    : coinIds.map((id) => txb.object(id));
}

export type SuiStructTag = {
  full_address: string;
  source_address: string;
  address: string;
  module: string;
  name: string;
  type_arguments: string[];
};

export type CoinAsset = {
  coinAddress: string;
  coinObjectId: string;
  balance: bigint;
};

function isSUI(coinType: string) {
  return coinType.toLowerCase().indexOf("sui") > -1;
}

function isSuiCoin(coinType: string) {
  return extractStructTagFromType(coinType).full_address === SUI_COIN_OBJECT_ID;
}

export function extractStructTagFromType(type: string): SuiStructTag {
  let _type = type.replace(/\s/g, "");

  const genericsString = _type.match(/(<.+>)$/);
  const generics = genericsString?.[0]?.match(
    /(\w+::\w+::\w+)(?:<.*?>(?!>))?/g
  );
  if (generics) {
    _type = _type.slice(0, _type.indexOf("<"));
    const tag = extractStructTagFromType(_type);
    const structTag: SuiStructTag = {
      ...tag,
      type_arguments: generics.map(
        (item) => extractStructTagFromType(item).source_address
      ),
    };
    structTag.type_arguments = structTag.type_arguments.map((item) => {
      return isSuiCoin(item)
        ? item
        : extractStructTagFromType(item).source_address;
    });
    structTag.source_address = composeType(
      structTag.full_address,
      structTag.type_arguments
    );
    return structTag;
  }
  const parts = _type.split("::");

  const structTag: SuiStructTag = {
    full_address: _type,
    address: parts[2] === "SUI" ? "0x2" : normalizeSuiObjectId(parts[0]),
    module: parts[1],
    name: parts[2],
    type_arguments: [],
    source_address: "",
  };
  structTag.full_address = `${structTag.address}::${structTag.module}::${structTag.name}`;
  structTag.source_address = composeType(
    structTag.full_address,
    structTag.type_arguments
  );
  return structTag;
}

export function composeType(address: string, generics: string[]): string;
export function composeType(
  address: string,
  struct: string,
  generics?: string[]
): string;
export function composeType(
  address: string,
  module: string,
  struct: string,
  generics?: string[]
): string;
export function composeType(address: string, ...args: unknown[]): string {
  const generics: string[] = Array.isArray(args[args.length - 1])
    ? (args.pop() as string[])
    : [];
  const chains = [address, ...args].filter(Boolean);

  let result: string = chains.join("::");

  if (generics && generics.length) {
    result += `<${generics.join(", ")}>`;
  }

  return result;
}

// const primaryCoinInputs =
//   (await TransactionUtil.syncBuildCoinInputForAmount(
//     this._sdk,
//     tx,
//     BigInt(min_sale_amount),
//     params.coin_type_sale
//   )) as TransactionArgument;

export async function selectTradeCoins(
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

// export async function buildInputCoinForAmount(
//   txb: TransactionBlock,
//   amount: bigint,
//   coinType: string,
//   owner: SuiAddress,
//   provider: JsonRpcProvider
// ): Promise<TransactionArgument[]> {
//   const allCoins = await provider.getAllCoins({
//     owner: owner,
//   });
//   const coinAssets: CoinAsset[] = await provider.getCoins({
//     owner: owner!,
//     coinType,
//   });
//   const coins = await provider.getCoins({ owner: owner });

//   if (amount === 0n) {
//     throw new Error(`The amount cannot be (${amount})`);
//   }

//   const amountTotal = await provider.getBalance({
//     owner: admin,
//     coinType,
//   });

//   // PROBABLY amountTotal.totalBalance
//   if (+amountTotal < amount) {
//     throw new Error(
//       `The amount(${+amountTotal}) is Insufficient balance for ${coinType} , expect ${amount} `
//     );
//   }

//   if (isSUI(coinType)) {
//     // const amountCoin = txb.splitCoins(txb.gas, [txb.pure(amount.toString())]);
//     // return [amountCoin];
//     return [txb.splitCoins(txb.gas, [txb.pure(amount)])[0]!];
//   }

//   const selectedCoinsResult = selectCoinObjectIdGreaterThanOrEqual(
//     coinAssets,
//     amount
//   );

//   //   const coinObjectIds = selectedCoinsResult.objectArray;
//   //   if (buildVector) {
//   //     return {
//   //       transactionArgument: txb.makeMoveVec({
//   //         objects: coinObjectIds.map((id) => txb.object(id)),
//   //       })
//   //     };
//   //   }
//   //   const [primaryCoinA, ...mergeCoinAs] = coinObjectIds;
//   //   const primaryCoinAInput: any = txb.object(primaryCoinA);

//   //   if (mergeCoinAs.length > 0) {
//   //     txb.mergeCoins(
//   //       primaryCoinAInput,
//   //       mergeCoinAs.map((coin) => txb.object(coin))
//   //     );
//   //   }

//   //   return {
//   //     transactionArgument: primaryCoinAInput,
//   //     remainCoins: selectedCoinsResult.remainCoins,
//   //   };
// }

function selectCoinObjectIdGreaterThanOrEqual(
  coins: CoinAsset[],
  amount: bigint,
  exclude: ObjectId[] = []
): { objectArray: ObjectId[]; remainCoins: CoinAsset[] } {
  const objectArray = selectCoinAssetGreaterThanOrEqual(
    coins,
    amount,
    exclude
  ).selectedCoins.map((item) => item.coinObjectId);
  const remainCoins = selectCoinAssetGreaterThanOrEqual(
    coins,
    amount,
    exclude
  ).remainingCoins;
  return { objectArray, remainCoins };
}

function selectCoinAssetGreaterThanOrEqual(
  coins: CoinAsset[],
  amount: bigint,
  exclude: ObjectId[] = []
): { selectedCoins: CoinAsset[]; remainingCoins: CoinAsset[] } {
  const sortedCoins = sortByBalance(
    coins.filter((c) => !exclude.includes(c.coinObjectId))
  );

  const total = calculateTotalBalance(sortedCoins);

  if (total < amount) {
    return { selectedCoins: [], remainingCoins: sortedCoins };
  }
  if (total === amount) {
    return { selectedCoins: sortedCoins, remainingCoins: [] };
  }

  let sum = BigInt(0);
  const selectedCoins = [];
  const remainingCoins = [...sortedCoins];
  while (sum < total) {
    const target = amount - sum;
    const coinWithSmallestSufficientBalanceIndex = remainingCoins.findIndex(
      (c) => c.balance >= target
    );
    if (coinWithSmallestSufficientBalanceIndex !== -1) {
      selectedCoins.push(
        remainingCoins[coinWithSmallestSufficientBalanceIndex]
      );
      remainingCoins.splice(coinWithSmallestSufficientBalanceIndex, 1);
      break;
    }

    const coinWithLargestBalance = remainingCoins.pop()!;
    if (coinWithLargestBalance.balance > 0) {
      selectedCoins.push(coinWithLargestBalance);
      sum += coinWithLargestBalance.balance;
    }
  }
  return {
    selectedCoins: sortByBalance(selectedCoins),
    remainingCoins: sortByBalance(remainingCoins),
  };
}

/**
 * Sort coin by balance in an ascending order
 */
function sortByBalance(coins: CoinAsset[]): CoinAsset[] {
  // eslint-disable-next-line no-nested-ternary
  return coins.sort((a, b) =>
    a.balance < b.balance ? -1 : a.balance > b.balance ? 1 : 0
  );
}

function sortByBalanceDes(coins: CoinAsset[]): CoinAsset[] {
  // eslint-disable-next-line no-nested-ternary
  return coins.sort((a, b) =>
    a.balance > b.balance ? -1 : a.balance < b.balance ? 0 : 1
  );
}

// eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
function calculateTotalBalance(coins: CoinAsset[]): bigint {
  return coins.reduce((partialSum, c) => partialSum + c.balance, BigInt(0));
}
