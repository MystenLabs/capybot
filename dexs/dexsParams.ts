export type CetusParams = {
  // transactionBlock: TransactionBlock;
  a2b: boolean;
  amountIn: number;
  amountOut: number;
  byAmountIn: boolean;
  slippage: number;
};

export type SuiswapParams = {
  // transactionBlock: TransactionBlock;
  a2b: boolean;
  amountIn: number;
};

export type TurbosParams = {
  // transactionBlock: TransactionBlock;
  a2b: boolean;
  amountIn: number;
  amountSpecifiedIsInput: boolean;
  slippage: number;
};
