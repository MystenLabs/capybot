export enum SourceType {
    Pool,
    Exchange,
}

export type DataEntry = {
    timestamp: number,
    source: string,
    sourceType: SourceType,
    coinTypeFrom: string,
    coinTypeTo: string,
    price: number,
}