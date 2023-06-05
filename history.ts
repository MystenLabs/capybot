// Cache of historic data for strategies to use

import {pools} from "./pools";

export type Entry = {
    pool: string,
    timestamp: string,
    amountA: number,
    amountB: number,
}
let history: Record<string, Array<Entry>> = {};

pools.forEach((pool) => {
    history[pool] = [];
});

/** Append to history */
export function append(pool: string, amounts: [number, number]) {
    let entry: Entry = {
        pool: pool,
        timestamp: new Date().toISOString(),
        amountA: amounts[0],
        amountB: amounts[1],
    }
    history[pool].push(entry);
}

/** Get the last N records for a given pool. If the current history is shorter than N, return all available records. */
export function getHistory(pool: string, n: number): Array<Entry> {
    let available = Math.min(n, history[pool].length);
    return history[pool].slice(history[pool].length - available, history[pool].length);
}
