import {
  Connection,
  Ed25519Keypair,
  JsonRpcProvider,
  RawSigner,
  SUI_CLOCK_OBJECT_ID,
  TransactionBlock,
} from "@mysten/sui.js";
import BN from "bn.js";

import Decimal from "decimal.js";
import { MAX_TICK_INDEX, MIN_TICK_INDEX } from "./constants";

const ONE_MINUTE = 60 * 1000;

type SwapParams = {
  network: string;
  package: string;
  module: string;
  pool: string;
  amountIn: number;
  amountLimit: number;
  amountSpecifiedIsInput: boolean;
  a2b: boolean;
  type0: string;
  type1: string;
  type2: string;
  versioned: string;
};

// https://s3.amazonaws.com/app.turbos.finance/sdk/contract.json
let swapParams: SwapParams;
// testnet || mainnet
swapParams = {
  network: "https://rpc.testnet.sui.io:443",
  package: "0xfea145c1608cd5366ffcf278c0124d9f416b30e33a6a47ee12c615420ee0224c",
  module: "pool_fetcher",
  pool: "0x7278ca6cf1fb19c6c8d5dc22aa245ebb8833e47885955f8334663e832b792a69",
  amountIn: 1000000000,
  amountLimit: 0,
  amountSpecifiedIsInput: true,
  a2b: false,
  type0:
    "0x541826891e877178df82f2df2996599618a259e719ef54a8e1969211c609cd21::turbos::TURBOS",
  type1: "0x2::sui::SUI",
  type2:
    "0xfea145c1608cd5366ffcf278c0124d9f416b30e33a6a47ee12c615420ee0224c::fee3000bps::FEE3000BPS",
  versioned:
    "0xeabd8d464e40856432781779bfa65f3acad242216b1e15d5838e95ffe5d73b6f",
};

const phrase = process.env.ADMIN_PHRASE;
const keypair = Ed25519Keypair.deriveKeypair(phrase!);

const connOptions = new Connection({
  fullnode: swapParams.network,
});
console.log("Connecting to ", swapParams.network);

let provider = new JsonRpcProvider(connOptions);
const signer = new RawSigner(keypair, provider);

const txb = new TransactionBlock();
txb.setGasBudget(1500000000);

const functionName = "compute_swap_result";
console.log(`${swapParams.package}::${swapParams.module}::${functionName}`);

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

// https://github.com/turbos-finance/turbos-clmm-sdk/blob/main/src/lib/trade.ts
// suiexplorer.com/object/0xcc1e9ec515810773ac9ad2ae41194ab0166300d9071a09a22cd8eb152138a3b3?network=testnet
txb.moveCall({
  target: `${swapParams.package}::${swapParams.module}::${functionName}`,
  arguments: [
    // Arg0: & mut Pool<Ty0, Ty1, Ty2>
    // ...routes.map(({ pool }) => txb.object(pool))
    txb.object(swapParams.pool),
    // Arg1: vector<Coin<Ty0>>
    // txb.makeMoveVec({ objects: this.coin.convertTradeCoins(txb, coinIds, coinTypeA, amountIn), })

    // txb.pure(a2b, "bool"),
    txb.pure(swapParams.a2b, "bool"),

    // amount_specified
    txb.pure(new Decimal(swapParams.amountIn).toFixed(0), "u128"),

    // amount_specified_is_input
    txb.pure(true, "bool"),

    // sqrt_price_limit
    txb.pure(
      tickIndexToSqrtPriceX64(
        swapParams.a2b ? MIN_TICK_INDEX : MAX_TICK_INDEX
      ).toString(),
      "u128"
    ),

    // Arg8: & Clock
    // txb.object(SUI_CLOCK_OBJECT_ID)
    txb.object(SUI_CLOCK_OBJECT_ID),
    // Arg9: & Versioned
    // txb.object(contract.Versioned)
    txb.object(swapParams.versioned),
  ],
  typeArguments: [swapParams.type0, swapParams.type1, swapParams.type2],
});

signer
  .signAndExecuteTransactionBlock({
    transactionBlock: txb,
    requestType: "WaitForLocalExecution",
    options: {
      showObjectChanges: true,
      showEffects: true,
    },
  })
  .then(function (res) {
    console.log("executed! result = ", res);
  });

function tickIndexToSqrtPriceX64(tickIndex: number): BN {
  if (tickIndex > 0) {
    return new BN(tickIndexToSqrtPricePositive(tickIndex));
  } else {
    return new BN(tickIndexToSqrtPriceNegative(tickIndex));
  }
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

function signedShiftRight(n0: BN, shiftBy: number, bitWidth: number) {
  let twoN0 = n0.toTwos(bitWidth).shrn(shiftBy);
  twoN0.imaskn(bitWidth - shiftBy + 1);
  return twoN0.fromTwos(bitWidth - shiftBy);
}
