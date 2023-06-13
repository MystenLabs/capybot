import { TransactionBlock } from "@mysten/sui.js";

export type cetusParams = {
  transactionBlock: TransactionBlock;
  amountIn: number;
  amountOut: number;
  byAmountIn: boolean;
  slippage: number;
};
