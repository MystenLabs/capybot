import {
    JsonRpcProvider,
    SUI_CLOCK_OBJECT_ID,
    TransactionArgument,
    TransactionBlock,
    mainnetConnection,
} from '@mysten/sui.js'
import { keypair } from '../../index'
import {
    buildInputCoinForAmount,
    getTotalBalanceByCoinType,
} from '../../utils/utils'
import { mainnet } from '../cetus/mainnet_config'
import { testnet } from '../cetus/testnet_config'
import { suiswapConfig } from '../dexsConfig'
import { SuiswapParams } from '../dexsParams'
import { Pool, PreswapResult } from '../pool'

enum sdkEnv {
    mainnet = 'mainnet',
    testnet = 'testnet',
}

// Use testnet or mainnet.
const currSdkEnv: sdkEnv = sdkEnv.mainnet

function buildSdkOptions() {
    switch (currSdkEnv) {
        case sdkEnv.mainnet:
            return mainnet
        case sdkEnv.testnet:
            return testnet
    }
}

export class SuiswapPool extends Pool<SuiswapParams> {
    private package: string
    private module: string
    private senderAddress: string

    constructor(address: string, coinTypeA: string, coinTypeB: string) {
        super(address, coinTypeA, coinTypeB)
        this.senderAddress = keypair.getPublicKey().toSuiAddress()

        this.package = suiswapConfig.contract.PackageId
        this.module = suiswapConfig.contract.ModuleId
    }

    /**
     * Create swap transaction
     * @param transactionBlock Transaction block
     * @param params Suiswap parameters
     * @returns Transaction block
     */
    async createSwapTransaction(
        transactionBlock: TransactionBlock,
        params: SuiswapParams
    ): Promise<TransactionBlock> {
        console.log(`Swap: (${params.amountIn}) [${
            params.a2b ? this.coinTypeA : this.coinTypeB
        }], 
       To: [${!params.a2b ? this.coinTypeA : this.coinTypeB}], 
       pool: ${this.uri}`)

        let provider = new JsonRpcProvider(mainnetConnection)

        const functionName = params.a2b ? 'swap_x_to_y' : 'swap_y_to_x'

        const totalBalanceForCoinType = await getTotalBalanceByCoinType(
            provider,
            this.senderAddress!,
            params.a2b ? this.coinTypeA : this.coinTypeB
        )

        if (BigInt(totalBalanceForCoinType) < params.amountIn)
            return transactionBlock

        const coins: TransactionArgument[] | undefined =
            await buildInputCoinForAmount(
                transactionBlock,
                BigInt(params.amountIn),
                params.a2b ? this.coinTypeA : this.coinTypeB,
                this.senderAddress!,
                provider
            )

        if (typeof coins !== 'undefined') {
            transactionBlock.moveCall({
                target: `${this.package}::${this.module}::${functionName}`,
                arguments: [
                    transactionBlock.object(this.uri),
                    transactionBlock.makeMoveVec({
                        objects: coins,
                    }),
                    transactionBlock.pure(params.amountIn.toFixed(0), 'u64'),
                    transactionBlock.pure(0, 'u64'),
                    transactionBlock.object(SUI_CLOCK_OBJECT_ID),
                ],
                typeArguments: [this.coinTypeA, this.coinTypeB],
            })

            return transactionBlock
        }

        return transactionBlock
    }

    async estimatePriceAndFee(): Promise<{
        price: number
        fee: number
    }> {
        // FIXME: estimate price
        return {
            price: 0 ** 2 / 2 ** 128,
            fee: 0,
        }
    }
}
