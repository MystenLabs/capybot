import {DataEntry} from "./data_entry";
import {Strategy} from "./strategy";
import {TradeSuggestion} from "./trade_suggestion";
import {logger} from "../logger";

type PoolWithDirection = {
    pool: string,
    a2b: boolean,
}

export class Arbitrage extends Strategy {

    private readonly lowerLimit: number;
    private readonly poolChain: Array<PoolWithDirection>;
    private latestRate: Record<string, number> = {};

    /** Relative limit is percentage, eg. 1.05 for a 5% win. */
    constructor(poolChain: Array<PoolWithDirection>, relativeLimit: number) {
        super("Arbitrage (" + poolChain.map(p => p.pool) + ")");
        this.poolChain = poolChain;
        this.lowerLimit = relativeLimit;
    }

    evaluate(data: DataEntry): Array<TradeSuggestion> {

        this.latestRate[data.pool.address] = data.priceOfB;

        // Compute the price when exchanging coins around the chain
        let arbitrage = 1;
        for (const p of this.poolChain) {
            let rate = this.latestRate[p.pool];
            if (rate == undefined) {
                // Not all pools have a registered value yet.
                return [];
            }
            arbitrage *= p.a2b ? rate : 1 / rate;
        }

            logger.info({arbitrage: arbitrage, poolChain: this.poolChain.map(p => p.pool.substring(0, 8)).toString()}, 'arbitrage');

        if (arbitrage > this.lowerLimit) {
            logger.info({arbitrage: arbitrage, poolChain: this.poolChain});
            return this.poolChain.map((p) => ({
                pool: p.pool,
                amount: 1,
                estimatedPrice: this.latestRate[p.pool],
                a2b: p.a2b
            }));
        } else if (arbitrage < 1 / this.lowerLimit) {
            logger.info({arbitrage: arbitrage, poolChain: this.poolChain});
            return this.poolChain.map((p) => ({
                pool: p.pool,
                amount: 1,
                estimatedPrice: this.latestRate[p.pool],
                a2b: p.a2b
            }));
        }

        // No decisions can be made at this point
        return [];
    }

    subscribes_to(): Array<string> {
        return this.poolChain.map(value => value.pool);
    }
}