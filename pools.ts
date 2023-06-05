// Pools to monitor
import {getCoinInfo} from "./coins";
import {adjustForSlippage, d, Percentage, Pool, sendTransaction} from "@cetusprotocol/cetus-sui-clmm-sdk/dist";
import BN from "bn.js";


import {sdk, signer} from "./config";

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
        by_amount_in: true,
        coinTypeA: pool.coinTypeA,
        coinTypeB: pool.coinTypeB,
        current_sqrt_price: pool.current_sqrt_price,
        decimalsA: coinA.decimals,
        decimalsB: coinB.decimals,
        pool: pool,
    });

    const slippage = Percentage.fromDecimal(d(5))
    const toAmount = new BN(res.estimatedAmountOut);
    console.log("Trying to swap " + amount + " " + (a2b ? coinA.name : coinB.name) + " for ~" + toAmount + " " + (a2b ? coinB.name : coinA.name) + " in pool " + pool_address + ".");

    const amountLimit = adjustForSlippage(toAmount, slippage, false);
    return sdk.Swap.createSwapTransactionPayload(
        {
            pool_id: pool.poolAddress,
            coinTypeA: pool.coinTypeA,
            coinTypeB: pool.coinTypeB,
            a2b: a2b,
            by_amount_in: true,
            amount: res.amount.toString(),
            amount_limit: amountLimit.toString(),
        },
    ).then((payload) => {
        sendTransaction(signer, payload)
    });
}
