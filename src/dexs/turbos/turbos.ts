import {
    JsonRpcProvider,
    SUI_CLOCK_OBJECT_ID,
    SuiObjectResponse,
    TransactionArgument,
    TransactionBlock,
    getObjectFields,
    mainnetConnection,
} from '@mysten/sui.js'
import BN from 'bn.js'
import Decimal from 'decimal.js'
import { Network, Trade, TurbosSdk } from 'turbos-clmm-sdk'
import { keypair } from '../../index'
import {
    buildInputCoinForAmount,
    getTotalBalanceByCoinType,
} from '../../utils/utils'
import { mainnet } from '../cetus/mainnet_config'
import { testnet } from '../cetus/testnet_config'
import { turbosConfig } from '../dexsConfig'
import { TurbosParams } from '../dexsParams'
import { Pool, PreswapResult } from '../pool'
import { MAX_TICK_INDEX, MIN_TICK_INDEX } from './constants'

const ONE_MINUTE = 60 * 1000

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

export class TurbosPool extends Pool<TurbosParams> {
    private sdk: TurbosSdk
    private package: string
    private module: string
    private senderAddress: string
    private versioned: string
    private coinTypeC: string
    private provider: JsonRpcProvider

    constructor(
        address: string,
        coinTypeA: string,
        coinTypeB: string,
        coinTypeC: string
    ) {
        super(address, coinTypeA, coinTypeB)
        this.coinTypeC = coinTypeC
        this.senderAddress = keypair.getPublicKey().toSuiAddress()

        this.package = turbosConfig.contract.PackageId
        this.module = turbosConfig.contract.ModuleId
        this.versioned = turbosConfig.contract.Versioned

        this.provider = new JsonRpcProvider(mainnetConnection)

        this.sdk = new TurbosSdk(Network.mainnet, this.provider)

        this.provider = new JsonRpcProvider(mainnetConnection)
        this.senderAddress = keypair.getPublicKey().toSuiAddress()
    }

    /**
     * Create swap transaction
     * @param transactionBlock Transaction block
     * @param params Turbos parameters
     * @returns Transaction block
     */
    async createSwapTransaction(
        transactionBlock: TransactionBlock,
        params: TurbosParams
    ): Promise<TransactionBlock> {
        const totalBalance = await getTotalBalanceByCoinType(
            this.provider,
            this.senderAddress,
            params.a2b ? this.coinTypeA : this.coinTypeB
        )

        console.log(
            `TotalBalance for CoinType (${
                params.a2b ? this.coinTypeA : this.coinTypeB
            }), is: ${totalBalance} and amountIn is: ${params.amountIn}`
        )

        if (params.amountIn > 0 && Number(totalBalance) >= params.amountIn) {
            //FIXME Skip swap USDC to SUI via Turbos, due to failure in execution.
            if (
                !params.a2b &&
                this.uri ===
                    '0x5eb2dfcdd1b15d2021328258f6d5ec081e9a0cdcfa9e13a0eaeb9b5f7505ca78'
            )
                return transactionBlock
            return await this.createTurbosTransactionBlockWithSDK(
                transactionBlock,
                params
            )
        }

        return transactionBlock
    }

    async createTransactionBlock(
        a2b: boolean,
        amountIn: number,
        amountSpecifiedIsInput: boolean,
        slippage: number
    ): Promise<TransactionBlock | undefined> {
        console.log(
            `Swap: (${amountIn}) [${a2b ? this.coinTypeA : this.coinTypeB}], 
       To: [${!a2b ? this.coinTypeA : this.coinTypeB}], 
       pool: ${this.uri}`
        )
        const admin = process.env.ADMIN_ADDRESS

        const functionName = a2b ? 'swap_a_b' : 'swap_b_a'

        const transactionBlock = new TransactionBlock()

        const coins: TransactionArgument[] | undefined =
            await buildInputCoinForAmount(
                transactionBlock,
                BigInt(amountIn),
                a2b ? this.coinTypeA : this.coinTypeB,
                admin!,
                this.provider
            )

        if (typeof coins !== 'undefined') {
            transactionBlock.moveCall({
                target: `${this.package}::${this.module}::${functionName}`,
                arguments: [
                    transactionBlock.object(this.uri),
                    transactionBlock.makeMoveVec({
                        objects: coins,
                    }),
                    transactionBlock.pure(amountIn.toFixed(0), 'u64'),
                    transactionBlock.pure(
                        amountOutWithSlippage(
                            amountIn,
                            slippage.toString(),
                            amountSpecifiedIsInput
                        ),
                        'u64'
                    ),
                    transactionBlock.pure(
                        tickIndexToSqrtPriceX64(
                            a2b ? MIN_TICK_INDEX : MAX_TICK_INDEX
                        ).toString(),
                        'u128'
                    ),
                    transactionBlock.pure(amountSpecifiedIsInput, 'bool'),
                    transactionBlock.object(this.senderAddress),
                    transactionBlock.pure(Date.now() + ONE_MINUTE * 3, 'u64'),
                    transactionBlock.object(SUI_CLOCK_OBJECT_ID),
                    transactionBlock.object(this.versioned),
                ],
                typeArguments: [this.coinTypeA, this.coinTypeB, this.coinTypeC],
            })

            return transactionBlock
        }
        return undefined
    }
    async createTurbosTransactionBlockWithSDK(
        transactionBlock: TransactionBlock,
        params: TurbosParams
    ): Promise<TransactionBlock> {
        console.log('createTurbosTransactionBlockWithSDK, a2b: ', params.a2b)
        const swapResult: Trade.ComputedSwapResult =
            await this.sdk.trade.computeSwapResult({
                pool: this.uri,
                a2b: params.a2b,
                address: this.senderAddress,
                amountSpecified: params.amountIn,
                amountSpecifiedIsInput: params.amountSpecifiedIsInput,
            })
        console.log('swapResult: ', swapResult)

        return this.sdk.trade.swap({
            routes: [
                {
                    pool: swapResult.pool,
                    a2b: swapResult.a_to_b,
                    nextTickIndex: this.sdk.math.bitsToNumber(
                        swapResult.tick_current_index.bits
                    ),
                },
            ],
            coinTypeA: swapResult.a_to_b ? this.coinTypeA : this.coinTypeB,
            coinTypeB: swapResult.a_to_b ? this.coinTypeB : this.coinTypeA,
            address: swapResult.recipient,
            amountA: swapResult.amount_a,
            amountB: swapResult.amount_b,
            amountSpecifiedIsInput: params.amountSpecifiedIsInput,
            slippage: params.slippage.toString(),
            txb: transactionBlock,
        })
    }

    async estimatePriceAndFee(): Promise<{
        price: number
        fee: number
    }> {
        const obj: SuiObjectResponse = await this.provider.getObject({
            id: this.uri,
            options: { showContent: true, showType: true },
        })
        let objFields = null
        if (obj && obj.data?.content?.dataType === 'moveObject') {
            objFields = getObjectFields(obj)
        }
        const current_sqrt_price = objFields?.sqrt_price

        const price = new Decimal(current_sqrt_price.toString())
            .mul(Decimal.pow(2, -64))
            .pow(2)

        const fee = objFields?.fee * 10 ** -6

        return {
            price: price.toNumber(),
            fee,
        }
    }

    addToTransactionBlock(
        transactionBlock: TransactionBlock,
        txbToBeAdded: TransactionBlock
    ): TransactionBlock {
        return transactionBlock
    }
}

function sqrtPriceX64ToPrice(
    sqrtPriceX64: BN,
    decimalsA: number,
    decimalsB: number
): Decimal {
    return new Decimal(sqrtPriceX64.toString())
        .mul(Decimal.pow(2, -64))
        .pow(2)
        .mul(Decimal.pow(10, decimalsA - decimalsB))
}

function amountOutWithSlippage(
    amountOut: Decimal.Value,
    slippage: string,
    amountSpecifiedIsInput: boolean
) {
    if (amountSpecifiedIsInput) {
        const minus = new Decimal(100).minus(slippage).div(100)
        return new Decimal(amountOut).mul(minus).toFixed(0)
    }

    const plus = new Decimal(100).plus(slippage).div(100)
    return new Decimal(amountOut).mul(plus).toFixed(0)
}
function tickIndexToSqrtPriceX64(tickIndex: number): BN {
    if (tickIndex > 0) {
        return new BN(tickIndexToSqrtPricePositive(tickIndex))
    } else {
        return new BN(tickIndexToSqrtPriceNegative(tickIndex))
    }
}

function tickIndexToSqrtPriceNegative(tickIndex: number) {
    let tick = Math.abs(tickIndex)
    let ratio: BN

    if ((tick & 1) != 0) {
        ratio = new BN('18445821805675392311')
    } else {
        ratio = new BN('18446744073709551616')
    }

    if ((tick & 2) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('18444899583751176498')),
            64,
            256
        )
    }
    if ((tick & 4) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('18443055278223354162')),
            64,
            256
        )
    }
    if ((tick & 8) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('18439367220385604838')),
            64,
            256
        )
    }
    if ((tick & 16) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('18431993317065449817')),
            64,
            256
        )
    }
    if ((tick & 32) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('18417254355718160513')),
            64,
            256
        )
    }
    if ((tick & 64) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('18387811781193591352')),
            64,
            256
        )
    }
    if ((tick & 128) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('18329067761203520168')),
            64,
            256
        )
    }
    if ((tick & 256) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('18212142134806087854')),
            64,
            256
        )
    }
    if ((tick & 512) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('17980523815641551639')),
            64,
            256
        )
    }
    if ((tick & 1024) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('17526086738831147013')),
            64,
            256
        )
    }
    if ((tick & 2048) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('16651378430235024244')),
            64,
            256
        )
    }
    if ((tick & 4096) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('15030750278693429944')),
            64,
            256
        )
    }
    if ((tick & 8192) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('12247334978882834399')),
            64,
            256
        )
    }
    if ((tick & 16384) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('8131365268884726200')),
            64,
            256
        )
    }
    if ((tick & 32768) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('3584323654723342297')),
            64,
            256
        )
    }
    if ((tick & 65536) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('696457651847595233')),
            64,
            256
        )
    }
    if ((tick & 131072) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('26294789957452057')),
            64,
            256
        )
    }
    if ((tick & 262144) != 0) {
        ratio = signedShiftRight(ratio.mul(new BN('37481735321082')), 64, 256)
    }

    return ratio
}

function tickIndexToSqrtPricePositive(tick: number) {
    let ratio: BN

    if ((tick & 1) != 0) {
        ratio = new BN('79232123823359799118286999567')
    } else {
        ratio = new BN('79228162514264337593543950336')
    }

    if ((tick & 2) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('79236085330515764027303304731')),
            96,
            256
        )
    }
    if ((tick & 4) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('79244008939048815603706035061')),
            96,
            256
        )
    }
    if ((tick & 8) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('79259858533276714757314932305')),
            96,
            256
        )
    }
    if ((tick & 16) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('79291567232598584799939703904')),
            96,
            256
        )
    }
    if ((tick & 32) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('79355022692464371645785046466')),
            96,
            256
        )
    }
    if ((tick & 64) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('79482085999252804386437311141')),
            96,
            256
        )
    }
    if ((tick & 128) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('79736823300114093921829183326')),
            96,
            256
        )
    }
    if ((tick & 256) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('80248749790819932309965073892')),
            96,
            256
        )
    }
    if ((tick & 512) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('81282483887344747381513967011')),
            96,
            256
        )
    }
    if ((tick & 1024) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('83390072131320151908154831281')),
            96,
            256
        )
    }
    if ((tick & 2048) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('87770609709833776024991924138')),
            96,
            256
        )
    }
    if ((tick & 4096) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('97234110755111693312479820773')),
            96,
            256
        )
    }
    if ((tick & 8192) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('119332217159966728226237229890')),
            96,
            256
        )
    }
    if ((tick & 16384) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('179736315981702064433883588727')),
            96,
            256
        )
    }
    if ((tick & 32768) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('407748233172238350107850275304')),
            96,
            256
        )
    }
    if ((tick & 65536) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('2098478828474011932436660412517')),
            96,
            256
        )
    }
    if ((tick & 131072) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('55581415166113811149459800483533')),
            96,
            256
        )
    }
    if ((tick & 262144) != 0) {
        ratio = signedShiftRight(
            ratio.mul(new BN('38992368544603139932233054999993551')),
            96,
            256
        )
    }

    return signedShiftRight(ratio, 32, 256)
}

function signedShiftRight(n0: BN, shiftBy: number, bitWidth: number) {
    let twoN0 = n0.toTwos(bitWidth).shrn(shiftBy)
    twoN0.imaskn(bitWidth - shiftBy + 1)
    return twoN0.fromTwos(bitWidth - shiftBy)
}
