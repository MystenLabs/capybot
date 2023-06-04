import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

import { Connection, Ed25519Keypair, JsonRpcProvider } from "@mysten/sui.js";

const fs = require("fs");

const phrase = process.env.ADMIN_PHRASE;
const keypair = Ed25519Keypair.deriveKeypair(phrase!);

const connOptions = new Connection({
  fullnode: "https://rpc.testnet.sui.io:443",
});
console.log("Connecting to ", "https://rpc.testnet.sui.io:443");

let provider = new JsonRpcProvider(connOptions);
const admin = process.env.ADMIN_ADDRESS!;

class CoinAsset = {
    coinAddress: SuiAddressType;
    coinObjectId: ObjectIdType;
    balance: BigInt;
}

// provider
//   .getAllCoins({
//     owner: admin!,
//   })
//   .then(function (res) {
//     console.log(res.data);
//   });

//   CoinAsset = {
//     coinAddress: SuiAddressType;
//     coinObjectId: SuiObjectIdType;
//     balance: bigint;
// }

let coinAssets: CoinAsset[] = [];

const coinsByCoinType = async (coinType: string) => {
  await provider
    .getCoins({
      owner: admin,
      coinType,
    })
    .then(function (res) {
      // console.log(res.data);

      res.data.forEach(function (c) {
        coinAssets.push(CoinAsset{ coinAddress: c.coinObjectId, coinObjectId: c.coinType, balance: BigInt(c.balance) });
        console.log(c.coinObjectId, " ", c.coinType, " ", c.balance);
      });
    });
};

coinsByCoinType(
  "0x588cff9a50e0eaf4cd50d337c1a36570bc1517793fd3303e1513e8ad4d2aa96::usdc::USDC"
);
