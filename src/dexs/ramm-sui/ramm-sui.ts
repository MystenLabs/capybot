import SDK, {
    Percentage,
    SdkOptions,
    adjustForSlippage,
    d,
} from '@cetusprotocol/cetus-sui-clmm-sdk/dist'

import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client'
import { TransactionBlock } from '@mysten/sui.js/transactions'
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui.js/utils';

import { SuiNetworks } from '../types'

import BN from 'bn.js'
import { getCoinInfo } from '../../coins/coins'
import { keypair } from '../../index'
import { getTotalBalanceByCoinType } from '../../utils/utils'
import { RAMMSuiParams } from '../dexsParams'
import { Pool, PreswapResult } from '../pool'

import { RAMMSuiPool, RAMMSuiPoolConfig } from '@ramm/ramm-sui-sdk'

export class RAMMPool extends Pool<RAMMSuiParams> {
    private rammSuiPool: RAMMSuiPool
    private suiClient: SuiClient
    private senderAddress: string
    private network: SuiNetworks

    constructor(address: string, coinTypeA: string, coinTypeB: string, network: SuiNetworks, rammConfig: RAMMSuiPoolConfig) {
        super(address, coinTypeA, coinTypeB)
        this.network = network
        this.rammSuiPool = new RAMMSuiPool(rammConfig)
        this.senderAddress = keypair.getPublicKey().toSuiAddress()

        this.suiClient = new SuiClient({url: getFullnodeUrl(network)})
        
    }

    /**
     * Create swap transaction
     * @param transactionBlock Transaction block
     * @param params Cetus parameters
     * @returns Transaction block
     */
    async createSwapTransaction(
        transactionBlock: TransactionBlock,
        params: RAMMSuiParams
    ): Promise<TransactionBlock> {
        this.rammSuiPool.tradeAmountIn(
            transactionBlock,
            {
                assetIn: params.assetIn,
                assetOut: params.assetOut,
                amountIn: params.amountIn,
                minAmountOut: 1
            }
        );

        transactionBlock
    }

    async estimatePriceAndFee(): Promise<{
        price: number
        fee: number
    }> {
        let pool = await this.sdk.Pool.getPool(this.uri)

        let price = pool.current_sqrt_price ** 2 / 2 ** 128
        let fee = pool.fee_rate * 10 ** -6

        return {
            price,
            fee,
        }
    }

    async createCetusTransactionBlockWithSDK(
        params: CetusParams
    ): Promise<TransactionBlock> {
        console.log(
            `a2b: ${params.a2b}, amountIn: ${params.amountIn}, amountOut: ${params.amountOut}, byAmountIn: ${params.byAmountIn}, slippage: ${params.slippage}`
        )

        // fix input token amount
        const coinAmount = new BN(params.amountIn)
        // input token amount is token a
        const byAmountIn = true
        // slippage value
        const slippage = Percentage.fromDecimal(d(5))
        // Fetch pool data
        const pool = await this.sdk.Pool.getPool(this.uri)
        // Estimated amountIn amountOut fee

        // Load coin info
        let coinA = getCoinInfo(this.coinTypeA)
        let coinB = getCoinInfo(this.coinTypeB)

        const res: any = await this.sdk.Swap.preswap({
            a2b: params.a2b,
            amount: coinAmount.toString(),
            byAmountIn: byAmountIn,
            coinTypeA: this.coinTypeA,
            coinTypeB: this.coinTypeB,
            currentSqrtPrice: pool.current_sqrt_price,
            decimalsA: coinA.decimals,
            decimalsB: coinB.decimals,
            pool: pool,
        })

        const toAmount = byAmountIn
            ? res.estimatedAmountOut
            : res.estimatedAmountIn
        // const amountLimit = adjustForSlippage(toAmount, slippage, !byAmountIn);

        const amountLimit = adjustForSlippage(
            new BN(toAmount),
            slippage,
            !byAmountIn
        )

        // build swap Payload
        const transactionBlock: TransactionBlock =
            await this.sdk.Swap.createSwapTransactionPayload({
                pool_id: pool.poolAddress,
                coinTypeA: pool.coinTypeA,
                coinTypeB: pool.coinTypeB,
                a2b: params.a2b,
                by_amount_in: byAmountIn,
                amount: res.amount.toString(),
                amount_limit: amountLimit.toString(),
            })

        return transactionBlock
    }
}
