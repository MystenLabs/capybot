import {
  Connection,
  JsonRpcProvider,
  Keypair,
  RawSigner,
  TransactionBlock,
} from "@mysten/sui.js";
import { setTimeout } from "timers/promises";
import { DataSource } from "./dexs/data_source";
import { CetusParams, SuiswapParams, TurbosParams } from "./dexs/dexsParams";
import { Pool } from "./dexs/pool";
import { logger } from "./logger";
import { Strategy } from "./strategies/strategy";

/**
 * A simple trading bot which subscribes to a number of trading pools across different DEXs. The bot may use multiple
 * strategies to trade on these pools.
 */
export class Capybot {
  public dataSources: Record<string, DataSource> = {};
  public pools: Record<
    string,
    Pool<CetusParams | SuiswapParams | TurbosParams>
  > = {};
  public strategies: Record<string, Array<Strategy>> = {};
  private keypair: Keypair;
  private provider: JsonRpcProvider;
  private signer: RawSigner;

  constructor(keypair: Keypair) {
    this.keypair = keypair;
    this.provider = new JsonRpcProvider(
      new Connection({
        fullnode: "https://rpc.mainnet.sui.io:443",
      })
    );
    this.signer = new RawSigner(this.keypair, this.provider);
  }

  async loop(duration: number, delay: number) {
    let startTime = new Date().getTime();

    let uniqueStrategies: Record<string, any> = {};
    for (const pool in this.strategies) {
      for (const strategy of this.strategies[pool]) {
        if (!uniqueStrategies.hasOwnProperty(strategy.uri)) {
          uniqueStrategies[strategy.uri] = strategy["parameters"];
        }
      }
    }
    logger.info({ strategies: uniqueStrategies }, "strategies");

    let transactionBlock: TransactionBlock = new TransactionBlock();
    while (new Date().getTime() - startTime < duration) {
      for (const uri in this.dataSources) {
        let dataSource = this.dataSources[uri];
        let data = await dataSource.getData();
        logger.info(
          {
            price: data,
          },
          "price"
        );

        // Push new data to all strategies subscribed to this data source
        for (const strategy of this.strategies[uri]) {
          // Get orders for this strategy.
          let tradeOrders = strategy.evaluate(data);

          // Create transactions for the suggested trades
          transactionBlock = new TransactionBlock();
          for (const order of tradeOrders) {
            logger.info({ strategy: strategy.uri, decision: order }, "order");
            let amountIn = Math.round(order.amountIn);
            let amountOut = Math.round(order.estimatedPrice * amountIn);
            const a2b: boolean = order.a2b;
            const byAmountIn: boolean = true;
            const slippage: number = 1; // TODO: Define this in a meaningful way. Perhaps by the strategies.

            transactionBlock = await this.pools[
              order.pool
            ].createSwapTransaction(transactionBlock, {
              a2b,
              amountIn,
              amountOut,
              byAmountIn,
              slippage,
            });
          }

          // Execute the transactions
          // TODO: Do these as a programmable transaction instead of individually
          try {
            transactionBlock.setGasBudget(1500000000);
            let result = await this.signer.signAndExecuteTransactionBlock({
              transactionBlock,
              requestType: "WaitForLocalExecution",
              options: {
                showObjectChanges: true,
                showEffects: true,
              },
            });
            logger.info(
              { strategy: strategy, transaction: result },
              "transaction"
            );
          } catch (e) {
            logger.error(e);
          }
        }
      }
      await setTimeout(delay);
    }
  }

  /** Add a strategy to this bot. The pools it subscribes to must have been added first. */
  addStrategy(strategy: Strategy) {
    for (const dataSource of strategy.subscribes_to()) {
      if (!this.dataSources.hasOwnProperty(dataSource)) {
        throw new Error(
          "Bot does not know the dataSource with address " + dataSource
        );
      }
      this.strategies[dataSource].push(strategy);
    }
  }

  /** Add a new price data source for this bot to use */
  addDataSource(dataSource: DataSource) {
    if (this.dataSources.hasOwnProperty(dataSource.uri)) {
      throw new Error(
        "Data source " + dataSource.uri + " has already been added."
      );
    }
    this.dataSources[dataSource.uri] = dataSource;
    this.strategies[dataSource.uri] = [];
  }

  /** Add a new pool for this bot to use for trading. */
  addPool(pool: Pool<CetusParams | SuiswapParams | TurbosParams>) {
    if (this.pools.hasOwnProperty(pool.uri)) {
      throw new Error("Pool " + pool.uri + " has already been added.");
    }
    this.pools[pool.uri] = pool;
    this.addDataSource(pool);
  }
}
