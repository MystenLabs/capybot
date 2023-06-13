import {
  Connection,
  JsonRpcProvider,
  Keypair,
  RawSigner,
  TransactionBlock,
} from "@mysten/sui.js";
import { setTimeout } from "timers/promises";
import { defaultAmount } from "./coins/coins";
import { cetusParams } from "./dexs/cetus/cetusParams";
import { Pool } from "./dexs/pool";
import { suiswapParams } from "./dexs/suiswap/suiswapParams";
import { turbosParams } from "./dexs/turbos/turbosParams";
import { logger } from "./logger";
import { DataEntry } from "./strategies/data_entry";
import { Strategy } from "./strategies/strategy";

/**
 * A simple trading bot which subscribes to a number of trading pools across different DEXs. The bot may use multiple
 * strategies to trade on these pools.
 */
export class Capybot {
  public pools: Record<
    string,
    Pool<cetusParams | suiswapParams | turbosParams>
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

    while (new Date().getTime() - startTime < duration) {
      for (const address in this.pools) {
        let pool = this.pools[address];
        let price = await pool.estimatePrice();

        let data: DataEntry = {
          pool: pool,
          priceOfB: price,
          timestamp: new Date().getTime(),
        };

        // Push new data to all strategies subscribed to this pool
        for (const strategy of this.strategies[address]) {
          // Compute a trading decision for this strategy.
          let tradeSuggestions = strategy.evaluate(data);

          let transactionBlock: TransactionBlock = new TransactionBlock();

          // Execute any suggested trades
          for (const tradeSuggestion of tradeSuggestions) {
            logger.info({ strategy: strategy.name, decision: tradeSuggestion });
            let amountIn: number =
              tradeSuggestion.amount *
              defaultAmount[
                tradeSuggestion.a2b ? pool.coinTypeB : pool.coinTypeA
              ];
            let amountOut: number = tradeSuggestion.estimatedPrice * amountIn;
            // TODO: Do these as a programmable transaction

            const byAmountIn: boolean = true;
            const slippage: number = 5; // Allow for 5% slippage (??)

            let txb: TransactionBlock = await this.pools[
              tradeSuggestion.pool
            ].createSwapTransaction({
              transactionBlock,
              amountIn,
              amountOut,
              byAmountIn,
              slippage,
            });

            await this.signer
              .signAndExecuteTransactionBlock({
                transactionBlock: txb,
                requestType: "WaitForLocalExecution",
                options: {
                  showObjectChanges: true,
                  showEffects: true,
                },
              })
              .then(function (res: any) {
                console.log("executed! result = ", res);
              });
          }
        }
      }
      await setTimeout(delay);
    }
  }

  /** Add a strategy to this bot. The pools it subscribes to must have been added first. */
  addStrategy(strategy: Strategy) {
    for (const pool of strategy.subscribes_to()) {
      if (!this.pools.hasOwnProperty(pool)) {
        throw new Error("Bot does not know the pool with address " + pool);
      }
      this.strategies[pool].push(strategy);
    }
  }

  /** Add a new pool for this bot to use for trading. */
  addPool(pool: Pool<cetusParams | suiswapParams | turbosParams>) {
    if (this.pools.hasOwnProperty(pool.address)) {
      throw new Error("Pool " + pool.address + " has already been added.");
    }
    this.pools[pool.address] = pool;
    this.strategies[pool.address] = [];
  }
}
