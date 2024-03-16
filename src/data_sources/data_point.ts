export enum DataType {
    Price,
    Other,
}

type BaseDataPoint<Type extends DataType> = {
    type: Type
    source_uri: string
}

export type PriceData = BaseDataPoint<DataType.Price> & {
    coinTypeFrom: string
    coinTypeTo: string
    price: number
    fee: number
}

export type OtherData = BaseDataPoint<DataType.Other> & { data: string }

export type DataPoint = PriceData | OtherData
