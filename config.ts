import {mainnet} from './mainnet_config'
import {testnet} from './testnet_config'

export enum sdkEnv {
    mainnet = "mainnet",
    testnet = "testnet",
}

export const currSdkEnv: sdkEnv = sdkEnv.mainnet

export function buildSdkOptions() {
    switch (currSdkEnv) {
        case sdkEnv.mainnet:
            return mainnet;
        case sdkEnv.testnet:
            return testnet;
    }

}
