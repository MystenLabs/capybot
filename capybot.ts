import {
  Connection,
  JsonRpcProvider,
  Keypair,
  RawSigner,
  TransactionBlock,
} from "@mysten/sui.js";
import { Strategy } from "./strategies/strategy";
import { Pool } from "./dexs/pool";
import { logger } from "./logger";
import { setTimeout } from "timers/promises";
import { DataSource } from "./dexs/data_source";

/**
 * A simple trading bot which subscribes to a number of trading pools across different DEXs. The bot may use multiple
 * strategies to trade on these pools.
 */
export class Capybot {
  public dataSources: Record<string, DataSource> = {};
  public pools: Record<string, Pool> = {};
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

          let transactionBlock: TransactionBlock = new TransactionBlock();
          transactionBlock.setGasBudget(1500000000);

          // Execute any suggested trades
          for (const order of tradeOrders) {
            console.log("*** for:", order);
            logger.info({ strategy: strategy.uri, decision: order }, "order");
            let amountIn = order.amountIn;
            let expectedAmountOut = order.estimatedPrice * amountIn;
            // TODO: Do these as a programmable transaction
            const txb = await this.pools[order.pool].createSwapTransaction(
              order.a2b,
              amountIn,
              expectedAmountOut,
              true,
              1 // Allow for 1% slippage (??)
            );
            if (typeof txb !== "undefined") {
              transactionBlock = txb;
              
              await this.signer
                .signAndExecuteTransactionBlock({
                  transactionBlock: transactionBlock,
                  requestType: "WaitForLocalExecution",
                  options: {
                    showObjectChanges: true,
                    showEffects: true,
                  },
                })
                .then((result) => {
                  // TODO: Execute transaction
                  logger.info(
                    { strategy: strategy, transaction: result },
                    "transaction"
                  );
                })
                .catch((e) => {
                  logger.error(e);
                });

              transactionBlock = new TransactionBlock();
            }
          }
          // await this.signAndExecuteTransactionBlock(transactionBlock);
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
  addPool(pool: Pool) {
    if (this.pools.hasOwnProperty(pool.uri)) {
      throw new Error("Pool " + pool.uri + " has already been added.");
    }
    this.pools[pool.uri] = pool;
    this.addDataSource(pool);
  }
}
