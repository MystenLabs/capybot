export enum SourceType {
    Pool,
    Exchange,
}

export type DataEntry = {
    timestamp: number,
    address: string,
    sourceType: SourceType,
    coinTypeA: string,
    coinTypeB: string,
    priceOfB: number,
}