export enum DataType {
    Price,
    Other,
}

type BaseDataPoint<Type extends DataType, PayloadType> = {
    type: Type,
    source_uri: string,
    payload: PayloadType,
}

export type PriceData = BaseDataPoint<DataType.Price, { coinTypeFrom: string,
    coinTypeTo: string, price: number }>;

export type OtherData = BaseDataPoint<DataType.Other, { data: string }>;

export type DataPoint = PriceData | OtherData;