import {Pool} from "../dexs/pool";

export type DataEntry = {
    timestamp: number,
    pool: Pool,
    priceOfB: number,
}