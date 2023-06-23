import {Strategy} from "./strategy";
import {DataPoint, DataType} from "../data_sources/data_point";
import {TradeOrder} from "./order";
import {Pool} from "../dexs/pool";
import {CetusParams, SuiswapParams, TurbosParams} from "../dexs/dexsParams";

export class MarketDifference extends Strategy {
  private readonly pool: Pool<CetusParams | SuiswapParams | TurbosParams>;
  private readonly exchanges: Array<string>;
  private latestPoolPrice: number | undefined;
  private readonly limit: number;
  private readonly defaultAmounts: [number, number];

  /**
   * Create a new market difference strategy. This strategy compare prices between a pool and various exchanges and
   * will buy the token that is too cheap and sell the token that is too expensive.
   *
   * @param pool The pool so monitor.
   * @param exchanges The exchanges to monitor. These should give the same price pairs as the pool.
   * @param defaultAmounts The default amounts to trade when the price difference is too large.
   * @param limit The relative limit for the price difference. If the price difference is larger than this, a trade will be made.
   *             A value of 1.05 means that the price difference should be at least 5%.
   * @param name A human-readable name for this strategy.
   */
  constructor(
    pool: Pool<CetusParams | SuiswapParams | TurbosParams>,
    exchanges: Array<string>,
    defaultAmounts: [number, number],
    limit: number,
    name: string,
  ) {
    super({
      name: name,
      pool: pool.uri,
      exchanges: exchanges,
    });
    this.pool = pool;
    this.exchanges = exchanges;
    this.defaultAmounts = defaultAmounts;
    this.limit = limit;
  }

  evaluate(data: DataPoint): Array<TradeOrder> {
    if (data.type != DataType.Price) {
      return [];
    }

    let price = data.price;

    if (data.source_uri == this.pool.uri) {
      this.latestPoolPrice = price;
      return [];
    }

    if (this.latestPoolPrice == undefined) {
      return [];
    }

    let priceRatio = price / this.latestPoolPrice;
    this.logStatus({
      poolPrice: this.latestPoolPrice,
      exchangePrice: price,
    });

    if (priceRatio > this.limit) {
      // The value of A is higher on the exchange than in the pool. Buy more A
      return [
        {
          pool: this.pool.uri,
          amountIn: this.defaultAmounts[1],
          estimatedPrice: 1 / this.latestPoolPrice,
          a2b: false,
        },
      ];
    } else if (priceRatio < 1 / this.limit) {
      // The value of A is lower on the exchange compared to the pool.
      return [
        {
          pool: this.pool.uri,
          amountIn: this.defaultAmounts[0],
          estimatedPrice: this.latestPoolPrice,
          a2b: true,
        },
      ];
    }

    return [];
  }

  subscribes_to(): Array<string> {
    return [this.pool.uri].concat(this.exchanges);
  }
}
