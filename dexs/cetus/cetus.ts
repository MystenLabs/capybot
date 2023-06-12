import {Pool, PreswapResult} from "../pool";
import {TransactionBlock} from "@mysten/sui.js";
import {getCoinInfo} from "../../coins/coins";
import {adjustForSlippage, d, Percentage, SDK} from "@cetusprotocol/cetus-sui-clmm-sdk/dist";
import BN from "bn.js";
import {mainnet} from "./mainnet_config";
import {testnet} from "./testnet_config";
import {keypair} from "../../app";

enum sdkEnv {
    mainnet = "mainnet",
    testnet = "testnet",
}

// Use testnet or mainnet.
const currSdkEnv: sdkEnv = sdkEnv.mainnet;

function buildSdkOptions() {
    switch (currSdkEnv) {
        case sdkEnv.mainnet:
            return mainnet;
        case sdkEnv.testnet:
            return testnet;
    }
}

export class CetusPool extends Pool {
    private sdk: SDK;

    constructor(address: string, coinTypeA: string, coinTypeB: string) {
        super(address, coinTypeA, coinTypeB);
        this.sdk = new SDK(buildSdkOptions())
        this.sdk.senderAddress = keypair.getPublicKey().toSuiAddress();
    }

    async createSwapTransaction(a2b: boolean, amountIn: number, amountOut: number, byAmountIn: boolean, slippage: number): Promise<TransactionBlock> {
        const amountLimit = adjustForSlippage(new BN(amountOut), Percentage.fromDecimal(d(slippage)), false);
        return this.sdk.Swap.createSwapTransactionPayload(
            {
                pool_id: this.address,
                coinTypeA: this.coinTypeA,
                coinTypeB: this.coinTypeB,
                a2b: a2b,
                by_amount_in: byAmountIn,
                amount: byAmountIn ? amountIn.toString() : amountOut.toString(),
                amount_limit: amountLimit.toString(),
            },
        );
    }

    async preswap(a2b: boolean, amount: number, byAmountIn: boolean): Promise<PreswapResult> {
        let pool = await this.sdk.Pool.getPool(this.address);

        // Load coin info
        let coinA = getCoinInfo(this.coinTypeA);
        let coinB = getCoinInfo(this.coinTypeB);

        const res: any = await this.sdk.Swap.preswap({
            a2b: a2b,
            amount: amount.toString(),
            by_amount_in: byAmountIn,
            coinTypeA: this.coinTypeA,
            coinTypeB: this.coinTypeB,
            current_sqrt_price: pool.current_sqrt_price,
            decimalsA: coinA.decimals,
            decimalsB: coinB.decimals,
            pool: pool,
        });

        return {
            estimatedAmountIn: res.estimatedAmountIn,
            estimatedAmountOut: res.estimatedAmountOut,
            estimatedFeeAmount: res.estimatedFeeAmount,
        };
    }

    async estimatePrice(): Promise<number> {
        let pool = await this.sdk.Pool.getPool(this.address);
        // current_sqrt_price is stored in Q64 format on Cetus
        return pool.current_sqrt_price ** 2 / (2 ** 128);
    }

}