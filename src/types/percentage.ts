import { TokenAmount } from './token_amount'

/**
 * Instances of this class represent a percentage value.
 */
export class Percentage {
    percentage: number

    constructor(percentage: number) {
        this.percentage = percentage
    }

    /** Returns the percentage as a a multiplier, e.g. 10% is returner as 0.1. */
    toRatio(): number {
        return this.percentage * 0.01
    }

    static fromRatio(ratio: number): Percentage {
        return new Percentage(ratio * 100)
    }

    /** Compute this percentage of a given `TokenAmount`. */
    ofAmount(amount: TokenAmount): TokenAmount {
        return new TokenAmount(this.toRatio() * amount.amount, amount.coin)
    }

    /** Add this percentage to a given `TokenAmount`. */
    addTo(amount: TokenAmount): TokenAmount {
        return amount.add(this.ofAmount(amount))
    }

    /** Remove this percentage to a given `TokenAmount`. */
    subtractFrom(amount: TokenAmount): TokenAmount {
        return amount.subtract(this.ofAmount(amount))
    }

    toString(): string {
        return this.percentage.toString + '%'
    }
}

export class Fee extends Percentage {
    constructor(fee_in_percent: number) {
        super(fee_in_percent)
    }

    /** Remove this fee from a `TokenAmount`. */
    deductFee(amount: TokenAmount): TokenAmount {
        return super.subtractFrom(amount)
    }
}
