export type argumentsType =
    | {
          kind: 'Input'
          index: number
          type?: 'object' | 'pure' | undefined
          value?: any
      }
    | {
          kind: 'GasCoin'
      }
    | {
          kind: 'Result'
          index: number
      }
    | {
          kind: 'NestedResult'
          index: number
          resultIndex: number
      }

export type MoveCallObject = {
    target: string
    arguments: argumentsType[]
    typeArguments: string[]
    coins?: string[]
}

export type SuiNetworks = 'mainnet' | 'testnet'