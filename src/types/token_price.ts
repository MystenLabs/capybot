import { CoinType, TokenAmount } from "./token_amount";

/**
 * Instances of this class represents the relative price of two different coin types.
 */
export class TokenPrice {
  readonly price: number;
  readonly coinFrom: any;
  readonly coinTo: any;

  constructor(price: number, coinFrom: CoinType, coinTo: CoinType) {
    this.price = price;
    this.coinFrom = coinFrom;
    this.coinTo = coinTo;
  }

  /** Get the price where `coinFrom` and `coinTo` are swapped. */
  getInversePrice(): TokenPrice {
    return new TokenPrice(1 / this.price, this.coinTo, this.coinFrom);
  }

  /** Convert the amount of `coinTo` returned if a given amount of `coinFrom` is traded for this price. */
  convert(amount: TokenAmount): TokenAmount {
    if (amount.coin != this.coinFrom) {
      throw new Error("The coin types does not match");
    }
    return new TokenAmount(amount.amount * this.price, this.coinFrom);
  }

  toString(): string {
    let oneCoinFrom = new TokenAmount(1, this.coinFrom);
    return (
      oneCoinFrom.toString() + " = " + this.convert(oneCoinFrom).toString()
    );
  }
}
