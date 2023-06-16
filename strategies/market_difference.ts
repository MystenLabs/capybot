import {Strategy} from "./strategy";
import {DataEntry} from "./data_entry";
import {TradeOrder} from "./order";
import {Pool} from "../dexs/pool";

export class MarketDifference extends Strategy {
    private readonly pool: Pool;
    private readonly exchanges: Array<string>;
    private latestPoolPrice: number;
    private readonly limit: number;
    private readonly defaultAmounts: [number, number];

    constructor(pool: Pool, exchanges: Array<string>, defaultAmounts: [number, number], limit: number) {
        super("MarketDifference (" + pool + ", " + exchanges + ")");
        this.pool = pool;
        this.exchanges = exchanges;
        this.defaultAmounts = defaultAmounts;
        this.limit = limit;
    }

    evaluate(data: DataEntry): Array<TradeOrder> {
        if (data.uri == this.pool.uri) {
            this.latestPoolPrice = data.price;
            return [];
        }

        if (this.latestPoolPrice == undefined) {
            return [];
        }

        if (data.price / this.latestPoolPrice > this.limit) {
            // The pool price for B is too low - buy B
            return [{
                pool: this.pool.uri,
                amountIn: this.defaultAmounts[0],
                estimatedPrice: this.latestPoolPrice,
                a2b: true
            }];
        } else if (data.price / this.latestPoolPrice < 1 / this.limit) {
            // The pool price for B is too high - buy A
            return [{
                pool: this.pool.uri,
                amountIn: this.defaultAmounts[1],
                estimatedPrice: 1 / this.latestPoolPrice,
                a2b: false
            }];
        }
    }

    subscribes_to(): Array<string> {
        return [this.pool.uri].concat(this.exchanges);
    }

}