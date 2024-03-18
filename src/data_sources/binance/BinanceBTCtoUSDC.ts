import { DataSource } from '../data_source'
import { DataPoint, DataType, PriceData } from '../data_point'
import { BTCtoUSDC } from '../../utils/binance-ticker-price'
import { getCoinDecimals } from '../../utils/utils'
import { coins } from '../../index'

export class BinanceBTCtoUSDC extends DataSource {
    constructor() {
        super('BinanceBTCtoUSDC')
    }

    getData(): Promise<DataPoint> {
        return BTCtoUSDC().then((value) => {
            let parsed = Number(value)
            let price =
                10 **
                    (getCoinDecimals(coins.WBTC) -
                        getCoinDecimals(coins.USDC)) /
                parsed
            return {
                type: DataType.Price,
                source_uri: this.uri,
                coinTypeFrom:
                    '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN',
                coinTypeTo:
                    '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
                price: price,
                fee: 0,
            }
        })
    }
}
