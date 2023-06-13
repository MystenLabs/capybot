import {
  Connection,
  JsonRpcProvider,
  SUI_CLOCK_OBJECT_ID,
  TransactionBlock,
} from "@mysten/sui.js";
import BN from "bn.js";
import Decimal from "decimal.js";
import { keypair } from "../../app";
import { buildInputCoinForAmount } from "../../utils/utils";
import { Pool, PreswapResult } from "../pool";
import { mainnet } from "./mainnet_config";
import { testnet } from "./testnet_config";
import { turbosParams } from "./turbosParams";

const ONE_MINUTE = 60 * 1000;

export const MAX_TICK_INDEX = 443636;
export const MIN_TICK_INDEX = -443636;

export const MAX_SQRT_PRICE = "79226673515401279992447579055";
export const MIN_SQRT_PRICE = "4295048016";

enum sdkEnv {
  mainnet = "mainnet",
  testnet = "testnet",
}

// Use testnet or mainnet.
const currSdkEnv: sdkEnv = sdkEnv.mainnet;

function buildSdkOptions() {
  switch (currSdkEnv) {
    case sdkEnv.mainnet:
      return mainnet;
    case sdkEnv.testnet:
      return testnet;
  }
}

export class TurbosPool extends Pool<turbosParams> {
  private package: string;
  private module: string;
  private versioned: string;
  private senderAddress: string;
  private coinTypeC: string;

  constructor(
    address: string,
    coinTypeA: string,
    coinTypeB: string,
    coinTypeC: string,
    a2b: boolean
  ) {
    super(address, coinTypeA, coinTypeB, a2b);

    this.senderAddress = keypair.getPublicKey().toSuiAddress();
    this.package = mainnet.package;
    this.module = mainnet.module;
    this.versioned = mainnet.module;
    this.coinTypeC = coinTypeC;
  }

  async createSwapTransaction(params: turbosParams): Promise<TransactionBlock> {
    let provider = new JsonRpcProvider(
      new Connection({
        fullnode: mainnet.fullRpcUrl,
      })
    );

    const txb = new TransactionBlock();
    txb.setGasBudget(500000000);

    const functionName = this.a2b ? "swap_a_b" : "swap_b_a";

    console.log("**** coinType: ", this.a2b ? this.coinTypeA : this.coinTypeB);

    const coins = await buildInputCoinForAmount(
      txb,
      BigInt(params.amountIn),
      this.a2b ? this.coinTypeA : this.coinTypeB,
      this.senderAddress,
      provider
    );

    txb.moveCall({
      target: `${this.package}::${this.module}::${functionName}`,
      arguments: [
        txb.object(this.address),
        txb.makeMoveVec({
          objects: coins,
        }),
        txb.pure(params.amountIn.toFixed(0), "u64"),
        txb.pure(
          amountOutWithSlippage(
            params.amountIn,
            params.slippage.toString(),
            params.amountSpecifiedIsInput
          ),
          "u64"
        ),
        txb.pure(
          tickIndexToSqrtPriceX64(
            this.a2b ? MIN_TICK_INDEX : MAX_TICK_INDEX
          ).toString(),
          "u128"
        ),
        txb.pure(params.amountSpecifiedIsInput, "bool"),
        txb.object(this.senderAddress),
        txb.pure(Date.now() + ONE_MINUTE * 3, "u64"),
        txb.object(SUI_CLOCK_OBJECT_ID),
        txb.object(this.versioned),
      ],
      typeArguments: [this.coinTypeA, this.coinTypeB, this.coinTypeC],
    });

    return txb;
  }

  preswap(
    a2b: boolean,
    amount: number,
    byAmountIn: boolean
  ): Promise<PreswapResult> {
    throw new Error("Method not implemented.");
  }
  estimatePrice(): Promise<number> {
    throw new Error("Method not implemented.");
  }
}

function getDefaultSqrtPriceLimit(a2b: boolean): BN {
  return new BN(a2b ? MIN_SQRT_PRICE : MAX_SQRT_PRICE);
}
function tickIndexToSqrtPriceX64(tickIndex: number): BN {
  if (tickIndex > 0) {
    return new BN(tickIndexToSqrtPricePositive(tickIndex));
  } else {
    return new BN(tickIndexToSqrtPriceNegative(tickIndex));
  }
}

function tickIndexToSqrtPriceNegative(tickIndex: number) {
  let tick = Math.abs(tickIndex);
  let ratio: BN;

  if ((tick & 1) != 0) {
    ratio = new BN("18445821805675392311");
  } else {
    ratio = new BN("18446744073709551616");
  }

  if ((tick & 2) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18444899583751176498")),
      64,
      256
    );
  }
  if ((tick & 4) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18443055278223354162")),
      64,
      256
    );
  }
  if ((tick & 8) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18439367220385604838")),
      64,
      256
    );
  }
  if ((tick & 16) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18431993317065449817")),
      64,
      256
    );
  }
  if ((tick & 32) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18417254355718160513")),
      64,
      256
    );
  }
  if ((tick & 64) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18387811781193591352")),
      64,
      256
    );
  }
  if ((tick & 128) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18329067761203520168")),
      64,
      256
    );
  }
  if ((tick & 256) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("18212142134806087854")),
      64,
      256
    );
  }
  if ((tick & 512) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("17980523815641551639")),
      64,
      256
    );
  }
  if ((tick & 1024) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("17526086738831147013")),
      64,
      256
    );
  }
  if ((tick & 2048) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("16651378430235024244")),
      64,
      256
    );
  }
  if ((tick & 4096) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("15030750278693429944")),
      64,
      256
    );
  }
  if ((tick & 8192) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("12247334978882834399")),
      64,
      256
    );
  }
  if ((tick & 16384) != 0) {
    ratio = signedShiftRight(ratio.mul(new BN("8131365268884726200")), 64, 256);
  }
  if ((tick & 32768) != 0) {
    ratio = signedShiftRight(ratio.mul(new BN("3584323654723342297")), 64, 256);
  }
  if ((tick & 65536) != 0) {
    ratio = signedShiftRight(ratio.mul(new BN("696457651847595233")), 64, 256);
  }
  if ((tick & 131072) != 0) {
    ratio = signedShiftRight(ratio.mul(new BN("26294789957452057")), 64, 256);
  }
  if ((tick & 262144) != 0) {
    ratio = signedShiftRight(ratio.mul(new BN("37481735321082")), 64, 256);
  }

  return ratio;
}

function tickIndexToSqrtPricePositive(tick: number) {
  let ratio: BN;

  if ((tick & 1) != 0) {
    ratio = new BN("79232123823359799118286999567");
  } else {
    ratio = new BN("79228162514264337593543950336");
  }

  if ((tick & 2) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79236085330515764027303304731")),
      96,
      256
    );
  }
  if ((tick & 4) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79244008939048815603706035061")),
      96,
      256
    );
  }
  if ((tick & 8) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79259858533276714757314932305")),
      96,
      256
    );
  }
  if ((tick & 16) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79291567232598584799939703904")),
      96,
      256
    );
  }
  if ((tick & 32) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79355022692464371645785046466")),
      96,
      256
    );
  }
  if ((tick & 64) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79482085999252804386437311141")),
      96,
      256
    );
  }
  if ((tick & 128) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("79736823300114093921829183326")),
      96,
      256
    );
  }
  if ((tick & 256) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("80248749790819932309965073892")),
      96,
      256
    );
  }
  if ((tick & 512) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("81282483887344747381513967011")),
      96,
      256
    );
  }
  if ((tick & 1024) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("83390072131320151908154831281")),
      96,
      256
    );
  }
  if ((tick & 2048) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("87770609709833776024991924138")),
      96,
      256
    );
  }
  if ((tick & 4096) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("97234110755111693312479820773")),
      96,
      256
    );
  }
  if ((tick & 8192) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("119332217159966728226237229890")),
      96,
      256
    );
  }
  if ((tick & 16384) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("179736315981702064433883588727")),
      96,
      256
    );
  }
  if ((tick & 32768) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("407748233172238350107850275304")),
      96,
      256
    );
  }
  if ((tick & 65536) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("2098478828474011932436660412517")),
      96,
      256
    );
  }
  if ((tick & 131072) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("55581415166113811149459800483533")),
      96,
      256
    );
  }
  if ((tick & 262144) != 0) {
    ratio = signedShiftRight(
      ratio.mul(new BN("38992368544603139932233054999993551")),
      96,
      256
    );
  }

  return signedShiftRight(ratio, 32, 256);
}

function signedShiftRight(n0: BN, shiftBy: number, bitWidth: number) {
  let twoN0 = n0.toTwos(bitWidth).shrn(shiftBy);
  twoN0.imaskn(bitWidth - shiftBy + 1);
  return twoN0.fromTwos(bitWidth - shiftBy);
}
function amountOutWithSlippage(
  amountOut: Decimal.Value,
  slippage: string,
  amountSpecifiedIsInput: boolean
) {
  if (amountSpecifiedIsInput) {
    const minus = new Decimal(100).minus(slippage).div(100);
    return new Decimal(amountOut).mul(minus).toFixed(0);
  }

  const plus = new Decimal(100).plus(slippage).div(100);
  return new Decimal(amountOut).mul(plus).toFixed(0);
}
