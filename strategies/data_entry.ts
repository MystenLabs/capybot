import { CetusParams, SuiswapParams, TurbosParams } from "../dexs/dexsParams";
import { Pool } from "../dexs/pool";

export type DataEntry = {
  timestamp: number;
  pool: Pool<CetusParams | SuiswapParams | TurbosParams>;
  priceOfB: number;
};
