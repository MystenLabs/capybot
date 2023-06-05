import {mainnet} from './mainnet_config'
import {testnet} from './testnet_config'
import {Ed25519Keypair, RawSigner} from "@mysten/sui.js";
import SDK from "@cetusprotocol/cetus-sui-clmm-sdk/dist";

export enum sdkEnv {
    mainnet = "mainnet",
    testnet = "testnet",
}

// Use testnet or mainnet.
export const currSdkEnv: sdkEnv = sdkEnv.mainnet;

export function buildSdkOptions() {
    switch (currSdkEnv) {
        case sdkEnv.mainnet:
            return mainnet;
        case sdkEnv.testnet:
            return testnet;
    }
}

export let sdk = new SDK(buildSdkOptions())

// Setup wallet from passphrase.
const mnemonics = 'polar fall caution tortoise monitor tray witness bonus dolphin clinic welcome enter';
export const keypair = Ed25519Keypair.deriveKeypair(mnemonics);
export const signer = new RawSigner(keypair, sdk.fullClient);
sdk.senderAddress = keypair.getPublicKey().toSuiAddress();
console.log("Using account: " + keypair.getPublicKey().toSuiAddress());
