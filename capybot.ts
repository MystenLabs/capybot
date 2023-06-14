import {
  Connection,
  JsonRpcProvider,
  Keypair,
  RawSigner,
  TransactionBlock,
} from "@mysten/sui.js";
import { setTimeout } from "timers/promises";
import { coins, defaultAmount } from "./coins/coins";
import { CetusParams, SuiswapParams, TurbosParams } from "./dexs/dexsParams";
import { Pool } from "./dexs/pool";
import { logger } from "./logger";
import { DataEntry } from "./strategies/data_entry";
import { Strategy } from "./strategies/strategy";
import {
  getBalancesForCoinTypes,
  getTotalBalanceByCoinType,
} from "./utils/utils";

/**
 * A simple trading bot which subscribes to a number of trading pools across different DEXs. The bot may use multiple
 * strategies to trade on these pools.
 */
export class Capybot {
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

    while (new Date().getTime() - startTime < duration) {
      let coinsBalances = await getBalancesForCoinTypes(
        this.provider,
        this.keypair.getPublicKey().toSuiAddress(),
        new Set<string>([
          coins.SUI,
          coins.USDC,
          coins.CETUS,
          coins.WETH,
          coins.USDT,
          coins.SUIP,
          coins.SUIA,
          coins.WSOL,
        ])
      );

      for (const address in this.pools) {
        let pool = this.pools[address];
        let price = await pool.estimatePrice();

        let data: DataEntry = {
          pool: pool,
          priceOfB: price,
          timestamp: new Date().getTime(),
        };

        logger.info(
          {
            pool: pool.pool,
            price: price,
          },
          "price"
        );

        // Push new data to all strategies subscribed to this pool
        for (const strategy of this.strategies[address]) {
          // Compute a trading decision for this strategy.
          let tradeSuggestions = strategy.evaluate(data);

          let transactionBlock: TransactionBlock = new TransactionBlock();
          transactionBlock.setGasBudget(1500000000);

          // Execute any suggested trades
          for (const tradeSuggestion of tradeSuggestions) {
            // logger.info({ strategy: strategy.name, decision: tradeSuggestion });
            let amountIn: number =
              tradeSuggestion.amount *
              defaultAmount[
                tradeSuggestion.a2b ? pool.coinTypeB : pool.coinTypeA
              ];
            let amountOut: number = tradeSuggestion.estimatedPrice * amountIn;

            const byAmountIn: boolean = true;
            const slippage: number = 5; // Allow for 5% slippage (??)

            // const totalCoinTypeBalance = await getTotalBalanceByCoinType(
            //   this.provider,
            //   this.keypair.getPublicKey().toSuiAddress(),
            //   tradeSuggestion.a2b ? pool.coinTypeB : pool.coinTypeA
            // );

            // const totalCoinTypeBalance = await getTotalBalanceByCoinType(
            //   this.provider,
            //   this.keypair.getPublicKey().toSuiAddress(),
            //   this.pools[tradeSuggestion.pool].a2b
            //     ? pool.coinTypeA
            //     : pool.coinTypeB
            // );

            // console.log(
            //   `**** amountIn: (${amountIn}) totalCoinTypeBalance: ${Number(
            //     totalCoinTypeBalance
            //   )}, coin: ${
            //     this.pools[tradeSuggestion.pool].a2b
            //       ? pool.coinTypeA
            //       : pool.coinTypeB
            //   }`
            // );

            const totalCoinTypeBalance = coinsBalances.get(
              this.pools[tradeSuggestion.pool].a2b
                ? pool.coinTypeA
                : pool.coinTypeB
            );

            if (amountIn <= Number(totalCoinTypeBalance)) {
              console.log(
                `if (${amountIn} < ${Number(totalCoinTypeBalance)}) - ${
                  this.pools[tradeSuggestion.pool].a2b
                    ? pool.coinTypeA
                    : pool.coinTypeB
                }, pool: ${this.pools[tradeSuggestion.pool].pool}`
              );
              transactionBlock = await this.pools[
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

              coinsBalances = await getBalancesForCoinTypes(
                this.provider,
                this.keypair.getPublicKey().toSuiAddress(),
                new Set<string>([
                  coins.SUI,
                  coins.USDC,
                  coins.CETUS,
                  coins.WETH,
                  coins.USDT,
                  coins.SUIP,
                  coins.SUIA,
                  coins.WSOL,
                ])
              );
              transactionBlock = new TransactionBlock();
            } else {
              console.log(
                `else (${amountIn} > ${Number(totalCoinTypeBalance)})`
              );
            }
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
  addPool(pool: Pool<CetusParams | SuiswapParams | TurbosParams>) {
    if (this.pools.hasOwnProperty(pool.pool)) {
      throw new Error("Pool " + pool.pool + " has already been added.");
    }
    this.pools[pool.pool] = pool;
    this.strategies[pool.pool] = [];
  }
}
