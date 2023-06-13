import { cetusParams } from "../dexs/cetus/cetusParams";
import { Pool } from "../dexs/pool";
import { suiswapParams } from "../dexs/suiswap/suiswapParams";
import { turbosParams } from "../dexs/turbos/turbosParams";

export type DataEntry = {
  timestamp: number;
  pool: Pool<cetusParams | suiswapParams | turbosParams>;
  priceOfB: number;
};
