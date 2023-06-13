import { TransactionBlock } from "@mysten/sui.js";

export type CetusParams = {
  transactionBlock: TransactionBlock;
  amountIn: number;
  amountOut: number;
  byAmountIn: boolean;
  slippage: number;
};

export type SuiswapParams = {
  transactionBlock: TransactionBlock;
  amountIn: number;
};

export type TurbosParams = {
  transactionBlock: TransactionBlock;
  amountIn: number;
  amountSpecifiedIsInput: boolean;
  slippage: number;
};
