export type CetusParams = {
  a2b: boolean;
  amountIn: number;
  amountOut: number;
  byAmountIn: boolean;
  slippage: number;
};

export type SuiswapParams = {
  a2b: boolean;
  amountIn: number;
};

export type TurbosParams = {
  a2b: boolean;
  amountIn: number;
  amountSpecifiedIsInput: boolean;
  slippage: number;
};
