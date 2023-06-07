import {DataEntry} from "../types/data_entry";
import {Strategy} from "./strategy";
import {TradeSuggestion} from "../types/trade_suggestion";
import {logger} from "../logger";

export type PoolInfo = {
    pool: string,
    a2b: boolean,
}

export class Arbitrage extends Strategy {

    private readonly lowerLimit: number;
    private readonly poolChain: Array<PoolInfo>;
    private latestRate: Record<string, number> = {};

    /** Relative limit is percentage, eg. 1.05 for a 5% win */
    constructor(poolChain: Array<PoolInfo>, relativeLimit: number) {
        super("Arbitrage (" + poolChain.map(p => p.pool) + ")");
        this.poolChain = poolChain;
        this.lowerLimit = relativeLimit;
    }

    evaluate(data: DataEntry): Array<TradeSuggestion> {

        this.latestRate[data.pool] = data.priceOfB;

        // Compute the price when exchanging coins around the chain
        let arbitrage = 1;
        for (const poolInfo of this.poolChain) {
            let rate = this.latestRate[poolInfo.pool];
            if (rate == undefined) {
                // Not all pools have a registered value yet.
                return [];
            }
            arbitrage *= poolInfo.a2b ? rate : 1 / rate;
        }

        if (arbitrage > this.lowerLimit) {
            logger.info({arbitrage: arbitrage, poolChain: this.poolChain});
            return this.poolChain.map((p) => ({
                pool: p.pool,
                amount: 1,
                a2b: p.a2b
            }));
        } else if (arbitrage < 1 / this.lowerLimit) {
            logger.info({arbitrage: arbitrage, poolChain: this.poolChain});
            return this.poolChain.map((p) => ({
                pool: p.pool,
                amount: 1,
                a2b: !p.a2b
            }));
        }

        // No decisions can be made at this point
        return [];
    }

    subscribe_to(): Array<string> {
        return this.poolChain.map(value => value.pool);
    }
}