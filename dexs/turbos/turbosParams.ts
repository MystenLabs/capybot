import { TransactionBlock } from "@mysten/sui.js";

export type turbosParams = {
  transactionBlock: TransactionBlock;
  amountIn: number;
  amountSpecifiedIsInput: boolean;
  slippage: number;
};
