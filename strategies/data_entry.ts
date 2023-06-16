export enum SourceType {
    Pool,
    Exchange,
}

export type DataEntry = {
    source: string,
    sourceType: SourceType,
    coinTypeFrom: string,
    coinTypeTo: string,
    price: number,
}