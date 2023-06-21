import {DataSource} from "../data_source";
import {DataEntry, SourceType} from "../data_entry";
import {BTCtoUSDC} from "../../utils/binance-ticker-price";
import {getCoinDecimals} from "../../utils/utils";
import {coins} from "../../index";

export class BinanceBTCtoUSDC extends DataSource {

  constructor() {
    super("BinanceBTCtoUSDC");
  }

  getData(): Promise<DataEntry> {
    return BTCtoUSDC().then(value => {
      let parsed = Number(value);
      let price = 10 ** (getCoinDecimals(coins.WBTC) - getCoinDecimals(coins.USDC)) / parsed;
      return {
        source: super.uri,
        price,
        sourceType: SourceType.Exchange,
        // Address for WBTC on SUI
        coinTypeFrom: "0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN",
        coinTypeTo: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
      }
    });
  }

}