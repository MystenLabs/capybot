// Pools to monitor
import {getCoinInfo} from "./coins";
import {adjustForSlippage, d, Percentage, Pool, sendTransaction} from "@cetusprotocol/cetus-sui-clmm-sdk/dist";
import BN from "bn.js";


import {sdk, signer} from "./config";
import {logger} from "./logger";

export async function getPoolInfo(pool: string): Promise<Pool> {
    return await sdk.Pool.getPool(pool);
}

/** Assuming the sender has enough funds, swap a given amount of tokens from the pool. */
export async function swap(pool_address: string, a2b: boolean, amount: number): Promise<unknown> {
    let pool = await sdk.Pool.getPool(pool_address);

    // Load coin info
    let coinA = getCoinInfo(pool.coinTypeA);
    let coinB = getCoinInfo(pool.coinTypeB);

    const res: any = await sdk.Swap.preswap({
        a2b: a2b,
        amount: amount.toString(),
        by_amount_in: false,
        coinTypeA: pool.coinTypeA,
        coinTypeB: pool.coinTypeB,
        current_sqrt_price: pool.current_sqrt_price,
        decimalsA: coinA.decimals,
        decimalsB: coinB.decimals,
        pool: pool,
    });

    const slippage = Percentage.fromDecimal(d(5))
    const toAmount = new BN(res.estimatedAmountOut);
    logger.info({preswap: {
        from: (a2b ? pool.coinTypeA : pool.coinTypeB),
        to: (a2b ? pool.coinTypeB : pool.coinTypeA),
        amount: amount,
        to_amount: toAmount,
        pool: pool_address
    }});

    const amountLimit = adjustForSlippage(toAmount, slippage, false);
    return sdk.Swap.createSwapTransactionPayload(
        {
            pool_id: pool.poolAddress,
            coinTypeA: pool.coinTypeA,
            coinTypeB: pool.coinTypeB,
            a2b: a2b,
            by_amount_in: false,
            amount: res.amount.toString(),
            amount_limit: amountLimit.toString(),
        },
    ).then((payload) => {
        sendTransaction(signer, payload)
    });
}
