import { CoinStruct, SuiClient, getFullnodeUrl } from '@mysten/sui.js/client'
import { TransactionBlock, TransactionObjectArgument } from '@mysten/sui.js/transactions'

import { SuiNetworks } from '../types'

import { keypair } from '../../index'
import { RAMMSuiParams } from '../dexsParams'
import { Pool } from '../pool'

import { RAMMSuiPool, RAMMSuiPoolConfig, PriceEstimationEvent } from '@ramm/ramm-sui-sdk'

export class RAMMPool extends Pool<RAMMSuiParams> {
    private rammSuiPool: RAMMSuiPool
    private suiClient: SuiClient
    private senderAddress: string
    private network: SuiNetworks
    private static readonly SUI_ADDRESS_SHORT: string = '0x2::SUI::sui'
    private static readonly SUI_ADDRESS_LONG: string = '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI'

    constructor(address: string, coinTypeA: string, coinTypeB: string, network: SuiNetworks, rammConfig: RAMMSuiPoolConfig) {
        super(address, coinTypeA, coinTypeB)
        this.network = network
        this.rammSuiPool = new RAMMSuiPool(rammConfig)
        this.senderAddress = keypair.getPublicKey().toSuiAddress()

        this.suiClient = new SuiClient({url: getFullnodeUrl(network)})
    }

    /**
     * Select a certain amount of a coin of a certain asset to perform a trade against the RAMM.
     *
     * @param txb Transaction block to which the coin selection/splitting transactions will be added
     * @param asset Asset in which denomination the coin will be selected
     * @param quantity Quantity of the asset to be prepared for payment
     * @returns Object with two properties:
     * 1. the quantity of the asset with the multiplier applied, and
     * 2. the new coin object, whose balance is equal to the value in 1.
     */
    async prepareCoinForPaymentCommon(txb: TransactionBlock, asset: string, quantityWithMultiplier: number)
        : Promise<{
            quantityWithMultiplier: number,
            newCoinObj: TransactionObjectArgument,
        }>
    {
        // If the currency used for the payment is `SUI`, split the needed amount from the gas
        // object.
        if(asset === RAMMPool.SUI_ADDRESS_LONG || asset === RAMMPool.SUI_ADDRESS_SHORT) {
            return {
                quantityWithMultiplier,
                newCoinObj: txb.splitCoins(txb.gas, [txb.pure(quantityWithMultiplier)])
            };
        }

        // Get all coins of type `asset` owned by the wallet
        const baseCoins = (await this.suiClient.getCoins({
            owner: this.senderAddress,
            coinType: asset,
            // By default, only 5 coins are queried, which may not be enough
            limit: 25
        })).data;
        const balance = (c: CoinStruct) => parseInt(c.balance);
        const basedCoinUsedToPay = baseCoins.find(c => (balance(c)) >= quantityWithMultiplier);
        // If there is a coin whose balance is large enough to pay for the trade, use it and
        // the process ends here.
        if(basedCoinUsedToPay) {
            return {
                quantityWithMultiplier,
                newCoinObj: txb.splitCoins(txb.object(basedCoinUsedToPay.coinObjectId), [txb.pure(quantityWithMultiplier)]),
            };
        }

        // Sort coins, from least to most valuable, and use as many as necessary to
        // pay for the trade.
        // Stop as soon as enough coins have been found.
        const sortedBaseCoins = baseCoins.sort((a, b) => (balance(a)) - (balance(b)));

        let sum = 0;
        const necessaryCoins: CoinStruct[] = [];
        // Assuming the wallet has enough balance, at the end of the loop, `necessaryCoins` will
        // be a list of coins such that
        // 1. the balances of which are individually insufficient to pay for the trade, but
        // 2. whose combined balance is sufficient.
        for (const coin of sortedBaseCoins) {
            const coinValue = balance(coin);
            sum += coinValue;
            necessaryCoins.push(coin);

            if (sum >= quantityWithMultiplier) {
                break;
            }
        }

        if (sum < quantityWithMultiplier) {
            throw new Error(`Insufficient balance to pay for the trade. Needed: ${quantityWithMultiplier}, found: ${sum}`);
        }

        // Base coin object, to which the remaining coins will be merged to pay for the trade
        const baseCoin = necessaryCoins[0];
        // The remaining coins, to be merged into the base coin.
        const otherCoins = necessaryCoins.slice(1);

        // Remember - `mergeCoins` does not return a PTB argument - it mutates its first argument,
        // the base coin
        txb.mergeCoins(txb.object(baseCoin.coinObjectId), otherCoins.map(c => txb.object(c.coinObjectId)));
        // `splitCoins` returns a list of coins whose length is the length of its second argument,
        // so in this case, one coin.
        const [newCoinObj] = txb.splitCoins(txb.object(baseCoin.coinObjectId), [txb.pure(quantityWithMultiplier)]);

        return {
            quantityWithMultiplier,
            newCoinObj,
        };
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
        if (params.amountIn === 0) {
            throw new Error('AmountIn or amountOut must be non-zero')
        }

        const { newCoinObj } = await this.prepareCoinForPaymentCommon(
            transactionBlock,
            params.assetIn,
            params.amountIn
        );


        this.rammSuiPool.tradeAmountIn(
            transactionBlock,
            {
                assetIn: params.assetIn,
                assetOut: params.assetOut,
                amountIn: newCoinObj,
                minAmountOut: 1
            }
        );

        return transactionBlock
    }

    /**
     * Given a trader for a RAMM Sui pool, a base asset, a quote asset and a quantity, returns the
     * estimated price a trade for such an amount would receive.
     *
     * The price will be expressed as a ratio of the quote asset to the base asset, i.e. the cost
     * of 1 unit of the quote asset in terms of the base asset.
     */
    public async estimatePriceAndFee(): Promise<{
        price: number,
        fee: number
    }> {
        const coinTypeAIndex = this.rammSuiPool.assetTypeIndices.get(this.coinTypeA)!;
        const coinTypeADecimals: number = this.rammSuiPool.assetConfigs[coinTypeAIndex].assetDecimalPlaces;

        const estimate_txb: TransactionBlock = this.rammSuiPool.estimatePriceWithAmountIn({
            assetIn: this.coinTypeA,
            assetOut: this.coinTypeB,
            // TODO this can be changed to reflect the actual amount being traded.
            // For a prototype, choosing to trade one unit of the currency will give a usable
            // approximation.
            amountIn: 1 * (10 ** coinTypeADecimals),
        });

        const devInspectRes = await this.suiClient.devInspectTransactionBlock({
            sender: this.senderAddress,
            transactionBlock: estimate_txb,
        });

        if (!devInspectRes || !devInspectRes.events || devInspectRes.events.length === 0) {
            throw new Error('No events found in the transaction block');
        }

        if (devInspectRes.error) {
            throw new Error("Price estimation devInpect failed with: " + devInspectRes.error);
        }

        // Price estimation, if successful, only returns one event, so this indexation is safe.
        const priceEstimationEventJSON = devInspectRes.events[0].parsedJson as PriceEstimationEvent;

        const coinTypeBIndex = this.rammSuiPool.assetTypeIndices.get(this.coinTypeB)!;
        const coinTypeBDecimals: number = this.rammSuiPool.assetConfigs[coinTypeBIndex].assetDecimalPlaces;

        const estimate_amount_in = priceEstimationEventJSON.amount_in / ( 10 ** coinTypeADecimals);
        const estimate_amount_out = priceEstimationEventJSON.amount_out / ( 10 ** coinTypeBDecimals);

        const price = estimate_amount_out / estimate_amount_in;
        const fee = priceEstimationEventJSON.protocol_fee / ( 10 ** coinTypeADecimals);

        return {
            price,
            fee
        };
    }
}
