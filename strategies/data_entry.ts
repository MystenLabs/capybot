export enum SourceType {
    Pool,
    Exchange,
}

export type DataEntry = {
    timestamp: number,
    uri: string,
    sourceType: SourceType,
    coinTypeFrom: string,
    coinTypeTo: string,
    price: number,
}