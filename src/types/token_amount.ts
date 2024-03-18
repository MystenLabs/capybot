/**
 * The SUI address for a coin type, e.g. "0x2::sui::SUI" for SUI.
 */
export type CoinType = string

/**
 * This class represents an amount of a given coin type.
 */
export class TokenAmount {
    readonly amount: number
    readonly coin: CoinType
    readonly symbol: string

    constructor(amount: number, coin: CoinType, symbol: string) {
        this.amount = amount
        this.coin = coin
        this.symbol = symbol
    }

    /**
     * Compute the sum of two `TokenAmount`s.
     *
     * @param other Another `TokenAmount`.
     * @returns The sum of this and the other amount, assuming they are the same coin type.
     */
    add(other: TokenAmount): TokenAmount {
        if (this.coin != other.coin) {
            throw new Error('Trying to add different coin types')
        }
        return new TokenAmount(this.amount + other.amount, this.coin, this.symbol)
    }

    /**
     * Compute the difference of two `TokenAmount`s.
     *
     * @param other Another `TokenAmount`.
     * @returns The difference of this and the other amount, assuming they are the same coin type.
     */
    subtract(other: TokenAmount): TokenAmount {
        if (this.coin != other.coin) {
            throw new Error('Trying to subtract different coin types')
        }
        return new TokenAmount(this.amount - other.amount, this.coin, this.symbol)
    }

    toString(): string {
        return this.amount.toString() + ' ' + this.symbol
    }
}
