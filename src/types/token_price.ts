import { Fee, Percentage } from './percentage'
import { CoinType, TokenAmount } from './token_amount'

/**
 * Instances of this class represents the relative price of two different coin types.
 */
export class TokenPrice {
    readonly price: number
    readonly coinFrom: any
    readonly coinTo: any

    constructor(price: number, coinFrom: CoinType, coinTo: CoinType) {
        this.price = price
        this.coinFrom = coinFrom
        this.coinTo = coinTo
    }

    /** Get the price where `coinFrom` and `coinTo` are swapped. */
    invert(): TokenPrice {
        return new TokenPrice(1 / this.price, this.coinTo, this.coinFrom)
    }

    /** Convert the amount of `coinTo` returned if a given amount of `coinFrom` is traded for this price. */
    convert(amount: TokenAmount): TokenAmount {
        if (amount.coin != this.coinFrom) {
            throw new Error('The coin types does not match')
        }
        return new TokenAmount(amount.amount * this.price, this.coinFrom)
    }

    /** Assuming `this.coinTo` equals `other.coinFrom`, this method returns the combined price of `this.coinFrom` as `other.coinTo`. */
    combine(other: TokenPrice): TokenPrice {
        if (this.coinTo != other.coinFrom) {
            throw new Error('this.coinTo much be equal to other.coinFrom')
        }
        return new TokenPrice(
            this.price * other.price,
            this.coinFrom,
            other.coinTo
        )
    }

    /** Combine this `TokenPrice` with a {@link Fee} computing the gross price including the fee. */
    includingFee(fee: Fee): TokenPrice {
        return new TokenPrice(
            this.price * (1 - fee.toRatio()),
            this.coinFrom,
            this.coinTo
        )
    }

    /** Compute the ratio of this `TokenPrice` over other as a {@link Percentage}. */
    difference(other: TokenPrice): Percentage {
        if (this.coinFrom != other.coinFrom || this.coinTo != other.coinTo) {
            throw new Error('Prices must be for the same pair.')
        }
        return Percentage.fromRatio(this.price / other.price)
    }

    toString(): string {
        let oneCoinFrom = new TokenAmount(1, this.coinFrom)
        return (
            oneCoinFrom.toString() +
            ' = ' +
            this.convert(oneCoinFrom).toString()
        )
    }
}
